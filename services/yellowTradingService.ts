import { createAuthRequestMessage, createAuthVerifyMessage, createAppSessionMessage } from "@erc7824/nitrolite"
import { ethers } from "ethers"
import { createWalletClient, custom } from "viem"
import { polygon } from "viem/chains"
import { Hex } from "viem"

// SES compatibility fix
declare global {
  interface Window {
    ethereum?: any
  }
}

// EIP-712 Types for authentication - this was missing!

const getAuthDomain = () => {
  return {
      name: "TokenSwiper",
  };
}; 

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

// Create a static MetaMask wallet client holder
let metaMaskWalletClient: ReturnType<typeof createWalletClient> | null = null;
let metaMaskAddress: string | null = null;

// Set the MetaMask wallet client from outside (will be called by the MetaMask hook)
export const setMetaMaskWalletClient = (client: ReturnType<typeof createWalletClient> | null, address: string | null) => {
  metaMaskWalletClient = client;
  metaMaskAddress = address;
  console.log("🦊 MetaMask wallet client set:", !!metaMaskWalletClient, "Address:", metaMaskAddress);
};

// Check if MetaMask is connected
export const isMetaMaskConnected = () => {
  return !!metaMaskWalletClient && !!metaMaskAddress;
};

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

const expire = String(Math.floor(Date.now() / 1000) + 3600);

// Add a safe localStorage accessor
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('localStorage.getItem error:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('localStorage.setItem error:', e);
    }
  }
};

class YellowTradingService {
  private ws: WebSocket | null = null
  private isConnected = false
  private isAuthenticated = false
  private stateWallet: ethers.Wallet | null = null
  private currentSession: TradingSession | null = null
  private positions: Map<string, Position> = new Map()
  private authTimeout: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null

  // ClearNode WebSocket URL from documentation
  private clearNodeUrl = "wss://clearnet.yellow.com/ws"

  constructor() {
    this.loadPositionsFromStorage()
  }

  // Initialize the trading service with detailed logging
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

      // Connect to ClearNode with timeout
      console.log("🌐 YellowTradingService: Connecting to ClearNode...")
      await this.connectToClearNode()
      console.log("✅ YellowTradingService: Initialization completed successfully")
      return true
    } catch (error) {
      console.error("💥 YellowTradingService: Failed to initialize:", error)

      // If ClearNode fails, create a demo session
      console.log("🎮 YellowTradingService: Creating demo session as fallback...")
      this.createDemoSession()
      return true // Return true so the app can continue in demo mode
    }
  }

  // Create a demo session when ClearNode fails
  private createDemoSession(): void {
    if (!this.stateWallet) return

    console.log("🎮 YellowTradingService: Setting up demo mode...")
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
  }

  // Connect to ClearNode WebSocket with proper timeout handling
  private async connectToClearNode(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log("🔌 YellowTradingService: Creating WebSocket connection to:", this.clearNodeUrl)
        this.ws = new WebSocket(this.clearNodeUrl)

        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          console.error("⏰ YellowTradingService: WebSocket connection timeout")
          if (this.ws) {
            this.ws.close()
          }
          reject(new Error("WebSocket connection timeout"))
        }, 10000) // 10 second timeout

        // Authentication timeout
        this.authTimeout = setTimeout(() => {
          console.error("⏰ YellowTradingService: Authentication timeout - no challenge received")
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout)
          reject(new Error("Authentication timeout - ClearNode not responding"))
        }, 20000) // 20 second auth timeout

        this.ws.onopen = async () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
            this.connectionTimeout = null
          }
          console.log("✅ YellowTradingService: WebSocket connected to ClearNode")
          this.isConnected = true

          // Start authentication
          console.log("🔐 YellowTradingService: Starting authentication...")
          try {
            await this.authenticate()
          } catch (authError) {
            if (this.authTimeout) clearTimeout(this.authTimeout)
            console.error("❌ YellowTradingService: Authentication failed:", authError)
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

  // Corrected authentication method
  private async authenticate(): Promise<void> {
    if (!this.stateWallet || !this.ws) {
      throw new Error("Wallet or WebSocket not available")
    }

    // Check if MetaMask is connected
    if (!metaMaskWalletClient || !metaMaskAddress) {
      throw new Error("MetaMask not connected. Please connect MetaMask first")
    }

    try {
      console.log("🔐 YellowTradingService: Creating authentication request...")

      // Corrected auth request - using the proper format from documentation
      const authRequest = await createAuthRequestMessage({
        wallet: ethers.getAddress(metaMaskAddress) as `0x${string}`, // MetaMask address
        participant: ethers.getAddress(this.stateWallet.address) as `0x${string}`,  // Local key (stateWallet) remains as participant
        app_name: "TokenSwiper",
        expire: expire, // 1 hour expiration
        scope: "trading",
        application: ethers.getAddress(metaMaskAddress) as `0x${string}`, // MetaMask address
        allowances: [],
      })

      console.log("📤 YellowTradingService: Sending auth request...")
      console.log("📋 YellowTradingService: Auth request preview:", authRequest.substring(0, 200) + "...")
      this.ws.send(authRequest)
    } catch (error) {
      console.error("💥 YellowTradingService: Authentication request failed:", error)
      throw error
    }
  }

  // Handle incoming WebSocket messages with proper authentication flow
  private async handleMessage(data: string, resolve?: Function, reject?: Function): Promise<void> {
    try {
      const message = JSON.parse(data)
      console.log(
        "📨 YellowTradingService: Processing message type:",
        message.res?.[1] || message.err?.[1] || "unknown",
      )

      if (message.res && message.res[1] === "auth_challenge") {
        console.log("🔐 YellowTradingService: Received auth challenge")
        if (this.authTimeout) {
          clearTimeout(this.authTimeout)
          this.authTimeout = null
        }
        await this.handleAuthChallenge(message)
      } else if (message.res && message.res[1] === "auth_success") {
        console.log("✅ YellowTradingService: Authentication successful!")
        this.isAuthenticated = true

        // Store JWT token if provided
        if (message.res[2] && message.res[2][0] && message.res[2][0].jwt_token) {
          safeLocalStorage.setItem("clearnode_jwt", message.res[2][0].jwt_token)
          console.log("💾 YellowTradingService: JWT token stored")
        }

        await this.createTradingSession()
        if (resolve) resolve() // Resolve the connection promise
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
        console.log("ℹ️ YellowTradingService: Unhandled message type:", message)
      }
    } catch (error) {
      console.error("💥 YellowTradingService: Error handling message:", error)
    }
  }

  // Corrected auth challenge handler with proper EIP-712 signing
  private async handleAuthChallenge(message: any): Promise<void> {
    if (!this.stateWallet || !this.ws) return

    try {
      console.log("🔐 YellowTradingService: Processing auth challenge...")
      console.log("📋 YellowTradingService: Challenge message:", message)

      // Extract challenge from the message
      const challengeData = message.res[2][0]
      if (!challengeData || !challengeData.challenge_message) {
        throw new Error("Invalid challenge format")
      }

      const challenge = challengeData.challenge_message
      console.log("🎯 YellowTradingService: Extracted challenge:", challenge)

      // Check if MetaMask is connected
      if (!metaMaskWalletClient || !metaMaskAddress) {
        throw new Error("MetaMask not connected. Please connect MetaMask first")
      }

      // Create EIP-712 message signer function using MetaMask
      const eip712MessageSigner = async (payload: any): Promise<`0x${string}`> => {
        try {
          console.log("✍️ YellowTradingService: Signing EIP-712 message with MetaMask...")
          console.log("📝 Payload to sign:", payload)
          console.log("🔑 metaMaskAddress:", metaMaskAddress)

          if (!metaMaskAddress) {
            throw new Error("MetaMask address not available")
          }

          // Extract challenge from the payload
          let challengeUUID = "";
          
          try {
            // Try to extract challenge from different payload formats
            if (typeof payload === "string") {
              try {
                const parsed = JSON.parse(payload);
                if (parsed.res && parsed.res[2] && parsed.res[2][0] && parsed.res[2][0].challenge_message) {
                  challengeUUID = parsed.res[2][0].challenge_message;
                }
              } catch (e) {
                challengeUUID = payload;
              }
            } else if (payload && typeof payload === "object") {
              // Handle challenge data object
              if (payload.res && payload.res[2] && payload.res[2][0]) {
                challengeUUID = payload.res[2][0].challenge_message || "";
              }
            }
          } catch (e) {
            console.error("Error extracting challenge:", e);
            // Use the raw challenge data as fallback
            challengeUUID = challenge;
          }
          
          // If extraction failed, use the original challenge
          if (!challengeUUID) {
            challengeUUID = challenge;
          }
          
          console.log("Extracted challenge:", challengeUUID);

          // Create the message structure as per documentation
          const messageToSign = {
            challenge: challengeUUID,
            scope: "trading",
            wallet: ethers.getAddress(metaMaskAddress) as `0x${string}`, // MetaMask address
            application: ethers.getAddress(metaMaskAddress) as `0x${string}`, // MetaMask address
            participant: ethers.getAddress(this.stateWallet!.address) as `0x${string}`, // Local key (stateWallet) remains as participant
            expire: parseInt(expire), // Convert to number
            allowances: [],
          }

          console.log("📝 YellowTradingService: Message to sign:", messageToSign)

          // Sign using EIP-712 structured data with MetaMask wallet client
          if (!metaMaskWalletClient) throw new Error("MetaMask wallet client not available");
          
          // Use the same domain structure as in the example code
          const signature = await metaMaskWalletClient.signTypedData({
            account: metaMaskWalletClient.account!,
            domain: getAuthDomain() as any,
            types: AUTH_TYPES,
            primaryType: "Policy",
            message: messageToSign,
          });

          console.log("✅ YellowTradingService: EIP-712 signature created:", signature.substring(0, 20) + "...")
          return signature
        } catch (error) {
          console.error("💥 YellowTradingService: Error signing EIP-712 message:", error)
          throw error
        }
      }

      // Create auth verify message using the corrected signer
      const authVerify = await createAuthVerifyMessage(
        eip712MessageSigner as any, // Type cast to resolve the MessageSigner mismatch
        message // Pass the raw message data
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

      // Create a properly typed message signer
      const messageSigner = async (payload: any): Promise<`0x${string}`> => {
        const message = JSON.stringify(payload)
        const digestHex = ethers.id(message)
        const messageBytes = ethers.getBytes(digestHex)
        const { serialized: signature } = this.stateWallet!.signingKey.sign(messageBytes)
        // Convert the signature to the expected format
        return ethers.hexlify(signature) as `0x${string}`
      }

      // Define trading session parameters
      const appDefinition = {
        protocol: "nitroliterpc",
        participants: [
          ethers.getAddress(this.stateWallet.address) as `0x${string}`, 
          ethers.getAddress(this.stateWallet.address) as `0x${string}`
        ], // Self-trading for demo
        weights: [100, 0],
        quorum: 100,
        challenge: 0,
        nonce: Date.now(),
      }

      const allocations = [
        {
          participant: ethers.getAddress(this.stateWallet.address) as `0x${string}`,
          asset: "usdc",
          amount: "1000000", // 1000 USDC with 6 decimals
        },
      ]

      const signedMessage = await createAppSessionMessage(
        messageSigner as any, 
        [
          {
            definition: appDefinition as any,
            allocations: allocations as any,
          },
        ]
      )

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
          participantB: this.stateWallet!.address, // Self-trading for demo
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

    if (!this.isAuthenticated || !this.currentSession) {
      console.error("❌ YellowTradingService: Cannot open position - not authenticated or no session")
      console.log("📊 YellowTradingService: Current status:", {
        isAuthenticated: this.isAuthenticated,
        hasSession: !!this.currentSession,
        isConnected: this.isConnected,
      })
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
      // Calculate final P&L
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
    try {
      const positionsArray = Array.from(this.positions.values())
      safeLocalStorage.setItem("trading_positions", JSON.stringify(positionsArray))
    } catch (error) {
      console.error("💥 YellowTradingService: Error saving positions to storage:", error)
    }
  }

  // Load positions from localStorage
  private loadPositionsFromStorage(): void {
    try {
      const stored = safeLocalStorage.getItem("trading_positions")
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
    console.log("🎯 YellowTradingService: isReady check:", {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      hasSession: !!this.currentSession,
      result: ready,
    })
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

  // Disconnect from ClearNode
  disconnect(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout)
      this.authTimeout = null
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
