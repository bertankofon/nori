import { createAuthRequestMessage, createAuthVerifyMessage, createAppSessionMessage } from "@erc7824/nitrolite"
import { ethers } from "ethers"

// SES compatibility fix
declare global {
  interface Window {
    ethereum?: any
  }
}

// EIP-712 Types for authentication
const AUTH_TYPES = {
  EIP712Domain: [{ name: "name", type: "string" }],
  Policy: [
    { name: "challenge", type: "string" },
    { name: "scope", type: "string" },
    { name: "wallet", type: "address" },
    { name: "application", type: "address" },
    { name: "participant", type: "address" },
    { name: "expire", type: "uint256" },
    { name: "allowances", type: "Allowances[]" },
  ],
  Allowances: [
    { name: "asset", type: "string" },
    { name: "amount", type: "uint256" },
  ],
}

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
  private authTimeout: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private isDemoMode = false

  // ClearNode WebSocket URL from documentation
  private clearNodeUrl = "wss://clearnet.yellow.com/ws"

  constructor() {
    this.loadPositionsFromStorage()
  }

  // Initialize the trading service with better error handling
  async initialize(privateKey: string): Promise<boolean> {
    try {
      console.log("🚀 YellowTradingService: Starting initialization...")

      // Create state wallet
      try {
        console.log("🔑 YellowTradingService: Creating wallet from private key...")
        const cleanKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
        this.stateWallet = new ethers.Wallet(cleanKey)
        console.log("✅ YellowTradingService: Wallet created successfully:", this.stateWallet.address)
      } catch (walletError) {
        console.error("❌ YellowTradingService: Failed to create wallet:", walletError)
        throw new Error("Invalid private key format")
      }

      // Try to connect to ClearNode with shorter timeout
      console.log("🌐 YellowTradingService: Attempting to connect to ClearNode...")
      console.log("ℹ️ YellowTradingService: Note - This requires a channel created at apps.yellow.com")

      try {
        await this.connectToClearNode()
        console.log("✅ YellowTradingService: Successfully connected to ClearNode")
        return true
      } catch (error) {
        console.warn("⚠️ YellowTradingService: ClearNode connection failed:", error.message)
        console.log("🎮 YellowTradingService: Falling back to demo mode...")
        this.createDemoSession()
        return true
      }
    } catch (error) {
      console.error("💥 YellowTradingService: Failed to initialize:", error)

      // Always fall back to demo mode if anything fails
      console.log("🎮 YellowTradingService: Creating demo session as final fallback...")
      this.createDemoSession()
      return true
    }
  }

  // Create a demo session when ClearNode fails
  private createDemoSession(): void {
    if (!this.stateWallet) return

    console.log("🎮 YellowTradingService: Setting up demo mode...")
    this.isDemoMode = true
    this.isConnected = true // Simulate connection
    this.isAuthenticated = true // Simulate authentication

    // Create a demo session
    this.currentSession = {
      appSessionId: `demo_${Date.now()}`,
      participantA: this.stateWallet.address,
      participantB: this.stateWallet.address,
      status: "active",
      positions: [],
    }

    console.log("✅ YellowTradingService: Demo session created:", this.currentSession.appSessionId)
    console.log("ℹ️ YellowTradingService: Running in DEMO MODE - no real transactions")
  }

  // Connect to ClearNode WebSocket with shorter timeout
  private async connectToClearNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log("🔌 YellowTradingService: Creating WebSocket connection to:", this.clearNodeUrl)
        this.ws = new WebSocket(this.clearNodeUrl)

        // Shorter connection timeout
        this.connectionTimeout = setTimeout(() => {
          console.error("⏰ YellowTradingService: WebSocket connection timeout")
          if (this.ws) {
            this.ws.close()
          }
          reject(new Error("WebSocket connection timeout"))
        }, 8000) // 8 second timeout

        // Shorter authentication timeout
        this.authTimeout = setTimeout(() => {
          console.error("⏰ YellowTradingService: Authentication timeout - no challenge received")
          console.log("💡 YellowTradingService: This usually means:")
          console.log("   1. You need to create a channel at apps.yellow.com")
          console.log("   2. The ClearNode service is not responding")
          console.log("   3. Your auth request format is incorrect")
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout)
          reject(new Error("Authentication timeout - ClearNode not responding"))
        }, 12000) // 12 second auth timeout

        this.ws.onopen = async () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
            this.connectionTimeout = null
          }
          console.log("✅ YellowTradingService: WebSocket connected to ClearNode")
          this.isConnected = true

          // Start authentication with better error handling
          console.log("🔐 YellowTradingService: Starting authentication...")
          try {
            await this.authenticate()
          } catch (authError) {
            if (this.authTimeout) clearTimeout(this.authTimeout)
            console.error("❌ YellowTradingService: Authentication setup failed:", authError)
            reject(authError)
          }
        }

        this.ws.onmessage = (event) => {
          console.log("📨 YellowTradingService: Received message:", event.data)
          this.handleMessage(event.data, resolve, reject)
        }

        this.ws.onerror = (error) => {
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout)
          if (this.authTimeout) clearTimeout(this.authTimeout)
          console.error("💥 YellowTradingService: WebSocket error:", error)
          this.isConnected = false
          reject(new Error("WebSocket connection failed"))
        }

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout)
          if (this.authTimeout) clearTimeout(this.authTimeout)
          console.log("🔌 YellowTradingService: WebSocket connection closed:", event.code, event.reason)
          this.isConnected = false
          this.isAuthenticated = false
        }
      } catch (error) {
        console.error("💥 YellowTradingService: Error creating WebSocket:", error)
        reject(error)
      }
    })
  }

  // Enhanced authentication with better debugging
  private async authenticate(): Promise<void> {
    if (!this.stateWallet || !this.ws) {
      throw new Error("Wallet or WebSocket not available")
    }

    try {
      console.log("🔐 YellowTradingService: Creating authentication request...")
      console.log("📋 YellowTradingService: Using wallet address:", this.stateWallet.address)

      // Try different auth request formats to see which one works
      let authRequest: string

      try {
        // Method 1: Using object format as shown in documentation
        authRequest = await createAuthRequestMessage({
          wallet: this.stateWallet.address,
          participant: this.stateWallet.address,
          app_name: "TokenSwiper",
          expire: Math.floor(Date.now() / 1000) + 3600,
          scope: "trading",
          application: this.stateWallet.address,
          allowances: [],
        })
        console.log("✅ YellowTradingService: Auth request created using object format")
      } catch (error) {
        console.warn("⚠️ YellowTradingService: Object format failed, trying alternative...")

        // Method 2: Try with message signer first parameter
        const messageSigner = async (payload: any) => {
          const message = JSON.stringify(payload)
          const digestHex = ethers.id(message)
          const messageBytes = ethers.getBytes(digestHex)
          const { serialized: signature } = this.stateWallet!.signingKey.sign(messageBytes)
          return signature
        }

        authRequest = await createAuthRequestMessage(messageSigner, this.stateWallet.address)
        console.log("✅ YellowTradingService: Auth request created using signer format")
      }

      console.log("📤 YellowTradingService: Sending auth request...")
      console.log("📋 YellowTradingService: Auth request preview:", authRequest.substring(0, 300) + "...")

      // Send the request
      this.ws.send(authRequest)
      console.log("✅ YellowTradingService: Auth request sent, waiting for challenge...")
    } catch (error) {
      console.error("💥 YellowTradingService: Authentication request failed:", error)
      throw error
    }
  }

  // Handle incoming WebSocket messages
  private async handleMessage(data: string, resolve?: Function, reject?: Function): Promise<void> {
    try {
      const message = JSON.parse(data)
      const messageType = message.res?.[1] || message.err?.[1] || "unknown"
      console.log("📨 YellowTradingService: Processing message type:", messageType)

      if (message.res && message.res[1] === "auth_challenge") {
        console.log("🔐 YellowTradingService: Received auth challenge!")
        if (this.authTimeout) {
          clearTimeout(this.authTimeout)
          this.authTimeout = null
        }
        await this.handleAuthChallenge(message, data)
      } else if (message.res && message.res[1] === "auth_success") {
        console.log("✅ YellowTradingService: Authentication successful!")
        this.isAuthenticated = true

        // Store JWT token if provided
        if (message.res[2] && message.res[2][0] && message.res[2][0].jwt_token) {
          localStorage.setItem("clearnode_jwt", message.res[2][0].jwt_token)
          console.log("💾 YellowTradingService: JWT token stored")
        }

        await this.createTradingSession()
        if (resolve) resolve()
      } else if (message.res && message.res[1] === "auth_failure") {
        console.error("❌ YellowTradingService: Authentication failed:", message.res[2])
        if (reject) reject(new Error(`Authentication failed: ${JSON.stringify(message.res[2])}`))
      } else if (message.res && message.res[1] === "create_app_session") {
        console.log("📈 YellowTradingService: Received app session response")
        await this.handleSessionCreated(message)
      } else if (message.err) {
        console.error("❌ YellowTradingService: Received error message:", message.err)
        if (reject) reject(new Error(`ClearNode error: ${message.err[1]} - ${message.err[2]}`))
      } else {
        console.log("ℹ️ YellowTradingService: Unhandled message type:", messageType)
        console.log("📋 YellowTradingService: Full message:", message)
      }
    } catch (error) {
      console.error("💥 YellowTradingService: Error handling message:", error)
    }
  }

  // Enhanced auth challenge handler
  private async handleAuthChallenge(message: any, rawData: string): Promise<void> {
    if (!this.stateWallet || !this.ws) return

    try {
      console.log("🔐 YellowTradingService: Processing auth challenge...")
      console.log("📋 YellowTradingService: Challenge message structure:", message)

      // Extract challenge from the message
      const challengeData = message.res[2][0]
      if (!challengeData || !challengeData.challenge_message) {
        throw new Error("Invalid challenge format - missing challenge_message")
      }

      const challenge = challengeData.challenge_message
      console.log("🎯 YellowTradingService: Extracted challenge:", challenge)

      // Create EIP-712 message signer function
      const eip712MessageSigner = async (payload: any) => {
        try {
          console.log("✍️ YellowTradingService: Creating EIP-712 signature...")

          // Create the message structure as per documentation
          const messageToSign = {
            challenge: challenge,
            scope: "trading",
            wallet: this.stateWallet!.address,
            application: this.stateWallet!.address,
            participant: this.stateWallet!.address,
            expire: Math.floor(Date.now() / 1000) + 3600,
            allowances: [],
          }

          console.log("📝 YellowTradingService: Message to sign:", messageToSign)

          // Sign using EIP-712 structured data
          const signature = await this.stateWallet!.signTypedData(
            {
              name: "TokenSwiper",
            },
            AUTH_TYPES,
            messageToSign,
          )

          console.log("✅ YellowTradingService: EIP-712 signature created")
          return signature
        } catch (error) {
          console.error("💥 YellowTradingService: Error signing EIP-712 message:", error)
          throw error
        }
      }

      // Create auth verify message
      const authVerify = await createAuthVerifyMessage(
        eip712MessageSigner,
        rawData, // Pass the raw message data
        this.stateWallet.address,
      )

      console.log("📤 YellowTradingService: Sending auth verification...")
      this.ws.send(authVerify)
    } catch (error) {
      console.error("💥 YellowTradingService: Error handling auth challenge:", error)
      throw error
    }
  }

  // Create a trading session
  private async createTradingSession(): Promise<void> {
    if (!this.stateWallet || !this.ws || !this.isAuthenticated) {
      console.error("❌ YellowTradingService: Cannot create session - missing requirements")
      return
    }

    try {
      console.log("📈 YellowTradingService: Creating trading session...")

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
        participants: [this.stateWallet.address, this.stateWallet.address],
        weights: [100, 0],
        quorum: 100,
        challenge: 0,
        nonce: Date.now(),
      }

      const allocations = [
        {
          participant: this.stateWallet.address,
          asset: "usdc",
          amount: "1000000",
        },
      ]

      const signedMessage = await createAppSessionMessage(messageSigner, [
        {
          definition: appDefinition,
          allocations: allocations,
        },
      ])

      console.log("📤 YellowTradingService: Sending app session creation request...")
      this.ws.send(signedMessage)
    } catch (error) {
      console.error("💥 YellowTradingService: Error creating trading session:", error)
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
          participantB: this.stateWallet!.address,
          status: "active",
          positions: [],
        }
        console.log("✅ YellowTradingService: Trading session created successfully:", appSessionId)
      } else {
        console.error("❌ YellowTradingService: No app session ID in response:", message)
      }
    } catch (error) {
      console.error("💥 YellowTradingService: Error handling session creation:", error)
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
    console.log("📈 YellowTradingService: Attempting to open position:", { tokenSymbol, type, usdcAmount, entryPrice })

    if (this.isDemoMode) {
      console.log("🎮 YellowTradingService: Opening position in DEMO MODE")
    }

    if (!this.isAuthenticated || !this.currentSession) {
      console.error("❌ YellowTradingService: Cannot open position - not authenticated or no session")
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

      this.positions.set(position.id, position)
      this.currentSession.positions.push(position)
      this.savePositionsToStorage()

      console.log(`✅ YellowTradingService: Opened ${type} position:`, position)
      return position
    } catch (error) {
      console.error("💥 YellowTradingService: Error opening position:", error)
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
      const pnl = this.calculatePnL(position, currentPrice)
      position.status = "closed"
      position.currentPrice = currentPrice
      position.pnl = pnl
      this.savePositionsToStorage()

      console.log(`✅ YellowTradingService: Closed position ${positionId} with P&L: ${pnl}`)
      return true
    } catch (error) {
      console.error("💥 YellowTradingService: Error closing position:", error)
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
      console.error("💥 YellowTradingService: Error loading positions from storage:", error)
    }
  }

  // Check if service is ready for trading
  isReady(): boolean {
    const ready = this.isConnected && this.isAuthenticated && this.currentSession !== null
    return ready
  }

  // Get connection status
  getStatus(): { connected: boolean; authenticated: boolean; sessionActive: boolean } {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      sessionActive: this.currentSession !== null,
    }
  }

  // Check if running in demo mode
  isDemoModeActive(): boolean {
    return this.isDemoMode
  }

  // Disconnect from ClearNode
  disconnect(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout)
      this.authTimeout = null
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
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
