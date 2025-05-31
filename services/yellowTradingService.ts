import { createAuthRequestMessage, createAuthVerifyMessage, createAppSessionMessage } from "@erc7824/nitrolite"
import { ethers } from "ethers"

export interface Position {
  id: string
  tokenSymbol: string
  tokenName: string
  type: "long" | "short"
  amount: number // USDC amount
  entryPrice: number
  currentPrice: number
  pnl: number
  timestamp: number
  status: "open" | "closed"
}

export interface TradingSession {
  appSessionId: string
  participantA: string // User
  participantB: string // Trading counterparty/protocol
  status: "active" | "closed"
  positions: Position[]
}

class YellowTradingService {
  private ws: WebSocket | null = null
  private isConnected = false
  private isAuthenticated = false
  private stateWallet: ethers.Wallet | null = null
  private currentSession: TradingSession | null = null
  private positions: Map<string, Position> = new Map()

  // ClearNode WebSocket URL from documentation
  private clearNodeUrl = "wss://clearnet.yellow.com/ws"

  constructor() {
    this.loadPositionsFromStorage()
  }

  // Initialize the trading service
  async initialize(privateKey: string): Promise<boolean> {
    try {
      // Create state wallet
      this.stateWallet = new ethers.Wallet(privateKey)
      console.log("Trading service initialized with wallet:", this.stateWallet.address)

      // Connect to ClearNode
      await this.connectToClearNode()
      return true
    } catch (error) {
      console.error("Failed to initialize trading service:", error)
      return false
    }
  }

  // Connect to ClearNode WebSocket
  private async connectToClearNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.clearNodeUrl)

        this.ws.onopen = async () => {
          console.log("Connected to ClearNode")
          this.isConnected = true

          // Start authentication
          await this.authenticate()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error("ClearNode WebSocket error:", error)
          this.isConnected = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("ClearNode connection closed")
          this.isConnected = false
          this.isAuthenticated = false
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Authenticate with ClearNode
  private async authenticate(): Promise<void> {
    if (!this.stateWallet || !this.ws) {
      throw new Error("Wallet or WebSocket not available")
    }

    try {
      // Message signer function
      const messageSigner = async (payload: any) => {
        const message = JSON.stringify(payload)
        const digestHex = ethers.id(message)
        const messageBytes = ethers.getBytes(digestHex)
        const { serialized: signature } = this.stateWallet!.signingKey.sign(messageBytes)
        return signature
      }

      // Create auth request
      const authRequest = await createAuthRequestMessage({
        wallet: this.stateWallet.address,
        participant: this.stateWallet.address,
        app_name: "TokenSwiper",
        expire: Math.floor(Date.now() / 1000) + 3600,
        scope: "trading",
        application: this.stateWallet.address, // Using wallet address as app address
        allowances: [],
      })

      this.ws.send(authRequest)
    } catch (error) {
      console.error("Authentication failed:", error)
      throw error
    }
  }

  // Handle incoming WebSocket messages
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data)
      console.log("Received message:", message)

      if (message.res && message.res[1] === "auth_challenge") {
        await this.handleAuthChallenge(message)
      } else if (message.res && message.res[1] === "auth_success") {
        this.isAuthenticated = true
        console.log("Authentication successful")
        await this.createTradingSession()
      } else if (message.res && message.res[1] === "auth_failure") {
        console.error("Authentication failed:", message.res[2])
      } else if (message.res && message.res[1] === "create_app_session") {
        await this.handleSessionCreated(message)
      }
    } catch (error) {
      console.error("Error handling message:", error)
    }
  }

  // Handle authentication challenge
  private async handleAuthChallenge(message: any): Promise<void> {
    if (!this.stateWallet || !this.ws) return

    try {
      const messageSigner = async (payload: any) => {
        const messageStr = JSON.stringify(payload)
        const digestHex = ethers.id(messageStr)
        const messageBytes = ethers.getBytes(digestHex)
        const { serialized: signature } = this.stateWallet!.signingKey.sign(messageBytes)
        return signature
      }

      const authVerify = await createAuthVerifyMessage(messageSigner, message, this.stateWallet.address)

      this.ws.send(authVerify)
    } catch (error) {
      console.error("Error handling auth challenge:", error)
    }
  }

  // Create a trading session
  private async createTradingSession(): Promise<void> {
    if (!this.stateWallet || !this.ws || !this.isAuthenticated) return

    try {
      const messageSigner = async (payload: any) => {
        const message = JSON.stringify(payload)
        const digestHex = ethers.id(message)
        const messageBytes = ethers.getBytes(digestHex)
        const { serialized: signature } = this.stateWallet!.signingKey.sign(messageBytes)
        return signature
      }

      // Define trading session parameters
      const appDefinition = {
        protocol: "nitroliterpc",
        participants: [this.stateWallet.address, this.stateWallet.address], // Self-trading for demo
        weights: [100, 0],
        quorum: 100,
        challenge: 0,
        nonce: Date.now(),
      }

      const allocations = [
        {
          participant: this.stateWallet.address,
          asset: "usdc",
          amount: "1000000", // 1000 USDC with 6 decimals
        },
      ]

      const signedMessage = await createAppSessionMessage(messageSigner, [
        {
          definition: appDefinition,
          allocations: allocations,
        },
      ])

      this.ws.send(signedMessage)
    } catch (error) {
      console.error("Error creating trading session:", error)
    }
  }

  // Handle session creation response
  private async handleSessionCreated(message: any): Promise<void> {
    try {
      const appSessionId = message.res[2]?.[0]?.app_session_id
      if (appSessionId) {
        this.currentSession = {
          appSessionId,
          participantA: this.stateWallet!.address,
          participantB: this.stateWallet!.address, // Self-trading for demo
          status: "active",
          positions: [],
        }
        console.log("Trading session created:", appSessionId)
      }
    } catch (error) {
      console.error("Error handling session creation:", error)
    }
  }

  // Open a trading position
  async openPosition(
    tokenSymbol: string,
    tokenName: string,
    type: "long" | "short",
    usdcAmount: number,
    entryPrice: number,
  ): Promise<Position | null> {
    if (!this.isAuthenticated || !this.currentSession) {
      console.error("Not authenticated or no active session")
      return null
    }

    try {
      const position: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenSymbol,
        tokenName,
        type,
        amount: usdcAmount,
        entryPrice,
        currentPrice: entryPrice,
        pnl: 0,
        timestamp: Date.now(),
        status: "open",
      }

      // Store position
      this.positions.set(position.id, position)
      this.currentSession.positions.push(position)
      this.savePositionsToStorage()

      console.log(`Opened ${type} position:`, position)
      return position
    } catch (error) {
      console.error("Error opening position:", error)
      return null
    }
  }

  // Close a position
  async closePosition(positionId: string, currentPrice: number): Promise<boolean> {
    const position = this.positions.get(positionId)
    if (!position || position.status === "closed") {
      return false
    }

    try {
      // Calculate final P&L
      const pnl = this.calculatePnL(position, currentPrice)

      position.status = "closed"
      position.currentPrice = currentPrice
      position.pnl = pnl

      this.savePositionsToStorage()
      console.log(`Closed position ${positionId} with P&L: ${pnl}`)
      return true
    } catch (error) {
      console.error("Error closing position:", error)
      return false
    }
  }

  // Calculate P&L for a position
  private calculatePnL(position: Position, currentPrice: number): number {
    const priceChange = currentPrice - position.entryPrice
    const priceChangePercent = priceChange / position.entryPrice

    if (position.type === "long") {
      return position.amount * priceChangePercent
    } else {
      return position.amount * -priceChangePercent
    }
  }

  // Update position prices and P&L
  updatePositionPrices(tokenSymbol: string, currentPrice: number): void {
    for (const [id, position] of this.positions) {
      if (position.tokenSymbol === tokenSymbol && position.status === "open") {
        position.currentPrice = currentPrice
        position.pnl = this.calculatePnL(position, currentPrice)
      }
    }
    this.savePositionsToStorage()
  }

  // Get all open positions
  getOpenPositions(): Position[] {
    return Array.from(this.positions.values()).filter((p) => p.status === "open")
  }

  // Get positions for a specific token
  getPositionsForToken(tokenSymbol: string): Position[] {
    return Array.from(this.positions.values()).filter((p) => p.tokenSymbol === tokenSymbol)
  }

  // Get total P&L
  getTotalPnL(): number {
    return Array.from(this.positions.values())
      .filter((p) => p.status === "open")
      .reduce((total, position) => total + position.pnl, 0)
  }

  // Save positions to localStorage
  private savePositionsToStorage(): void {
    const positionsArray = Array.from(this.positions.values())
    localStorage.setItem("trading_positions", JSON.stringify(positionsArray))
  }

  // Load positions from localStorage
  private loadPositionsFromStorage(): void {
    try {
      const stored = localStorage.getItem("trading_positions")
      if (stored) {
        const positionsArray: Position[] = JSON.parse(stored)
        this.positions.clear()
        positionsArray.forEach((position) => {
          this.positions.set(position.id, position)
        })
      }
    } catch (error) {
      console.error("Error loading positions from storage:", error)
    }
  }

  // Check if service is ready for trading
  isReady(): boolean {
    return this.isConnected && this.isAuthenticated && this.currentSession !== null
  }

  // Get connection status
  getStatus(): { connected: boolean; authenticated: boolean; sessionActive: boolean } {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      sessionActive: this.currentSession !== null,
    }
  }

  // Disconnect from ClearNode
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.isAuthenticated = false
    this.currentSession = null
  }
}

export const yellowTradingService = new YellowTradingService()
