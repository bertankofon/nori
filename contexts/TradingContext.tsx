"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { yellowTradingService, type Position } from "@/services/yellowTradingService"

interface TradingContextType {
  isInitialized: boolean
  isReady: boolean
  positions: Position[]
  totalPnL: number
  initializeTrading: (privateKey: string) => Promise<boolean>
  openPosition: (
    tokenSymbol: string,
    tokenName: string,
    type: "long" | "short",
    amount: number,
    price: number,
  ) => Promise<Position | null>
  closePosition: (positionId: string, currentPrice: number) => Promise<boolean>
  updateTokenPrice: (tokenSymbol: string, price: number) => void
  getPositionsForToken: (tokenSymbol: string) => Position[]
  status: { connected: boolean; authenticated: boolean; sessionActive: boolean }
  // Add this for debugging
  setIsInitialized: (value: boolean) => void
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [totalPnL, setTotalPnL] = useState(0)

  // Add debug logging for state changes
  useEffect(() => {
    console.log("TradingContext - isInitialized changed to:", isInitialized)
  }, [isInitialized])

  // Memoize the update functions to prevent infinite re-renders
  const updatePositions = useCallback((): void => {
    const openPositions = yellowTradingService.getOpenPositions()
    const pnl = yellowTradingService.getTotalPnL()
    setPositions(openPositions)
    setTotalPnL(pnl)
  }, [])

  const updateTokenPrice = useCallback(
    (tokenSymbol: string, price: number): void => {
      yellowTradingService.updatePositionPrices(tokenSymbol, price)
      updatePositions()
    },
    [updatePositions],
  )

  // Initialize trading service with detailed logging
  const initializeTrading = useCallback(async (privateKey: string): Promise<boolean> => {
    try {
      console.log("🚀 TradingContext: Starting trading initialization...")

      // Validate private key format
      if (!privateKey || privateKey.length < 64) {
        console.error("❌ TradingContext: Invalid private key format")
        return false
      }

      console.log("🔑 TradingContext: Private key validated, calling yellowTradingService.initialize...")
      const success = await yellowTradingService.initialize(privateKey)
      console.log("📊 TradingContext: yellowTradingService.initialize returned:", success)

      if (success) {
        console.log("✅ TradingContext: Setting isInitialized to true")
        setIsInitialized(true)

        // Double-check the service status
        const status = yellowTradingService.getStatus()
        const isReady = yellowTradingService.isReady()
        console.log("📈 TradingContext: Service status after init:", status)
        console.log("🎯 TradingContext: Service isReady:", isReady)
      } else {
        console.log("❌ TradingContext: Initialization failed, keeping isInitialized as false")
      }

      return success
    } catch (error) {
      console.error("💥 TradingContext: Failed to initialize trading:", error)
      return false
    }
  }, [])

  // Open a new position
  const openPosition = useCallback(
    async (
      tokenSymbol: string,
      tokenName: string,
      type: "long" | "short",
      amount: number,
      price: number,
    ): Promise<Position | null> => {
      console.log("📈 TradingContext: Opening position:", { tokenSymbol, type, amount, price })
      const position = await yellowTradingService.openPosition(tokenSymbol, tokenName, type, amount, price)
      if (position) {
        console.log("✅ TradingContext: Position opened successfully:", position)
        updatePositions()
      } else {
        console.log("❌ TradingContext: Failed to open position")
      }
      return position
    },
    [updatePositions],
  )

  // Close a position
  const closePosition = useCallback(
    async (positionId: string, currentPrice: number): Promise<boolean> => {
      const success = await yellowTradingService.closePosition(positionId, currentPrice)
      if (success) {
        updatePositions()
      }
      return success
    },
    [updatePositions],
  )

  // Get positions for a specific token
  const getPositionsForToken = useCallback((tokenSymbol: string): Position[] => {
    return yellowTradingService.getPositionsForToken(tokenSymbol)
  }, [])

  // Get service status with logging
  const status = yellowTradingService.getStatus()
  const isReady = yellowTradingService.isReady()

  // Log status changes
  useEffect(() => {
    console.log("📊 TradingContext: Status update:", { status, isReady, isInitialized })
  }, [status.connected, status.authenticated, status.sessionActive, isReady, isInitialized])

  // Update positions periodically - only run once
  useEffect(() => {
    const interval = setInterval(updatePositions, 5000) // Reduced frequency to 5 seconds
    return () => clearInterval(interval)
  }, [updatePositions])

  // Load initial positions - only run once when initialized
  useEffect(() => {
    if (isInitialized) {
      console.log("🔄 TradingContext: isInitialized is true, updating positions...")
      updatePositions()
    }
  }, [isInitialized, updatePositions])

  return (
    <TradingContext.Provider
      value={{
        isInitialized,
        isReady,
        positions,
        totalPnL,
        initializeTrading,
        openPosition,
        closePosition,
        updateTokenPrice,
        getPositionsForToken,
        status,
        setIsInitialized, // Add this for debugging
      }}
    >
      {children}
    </TradingContext.Provider>
  )
}

export function useTrading() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error("useTrading must be used within a TradingProvider")
  }
  return context
}
