"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { mockTokens } from "@/lib/mock-data"

// Define types
export type PositionType = "long" | "short"

export interface Position {
  id: string
  symbol: string
  name: string
  type: PositionType
  amount: number
  entryPrice: number
  currentPrice: number
  timestamp: number
  pnl: number
  pnlPercentage: number
  leverage: number
  color?: string
}

interface TradingContextType {
  isInitialized: boolean
  isReady: boolean
  status: string
  positions: Position[]
  totalPnL: number
  leverage: number
  setLeverage: (leverage: number) => void
  initialize: (privateKey?: string) => Promise<boolean>
  openPosition: (
    symbol: string,
    name: string,
    type: PositionType,
    amount: number,
    price: number,
  ) => Promise<Position | null>
  closePosition: (id: string) => Promise<boolean>
  updateTokenPrice: (symbol: string, price: number) => void
  getPositionsForToken: (symbol: string) => Position[]
}

// Create context
const TradingContext = createContext<TradingContextType | undefined>(undefined)

// Provider component
export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [status, setStatus] = useState("Not initialized")
  const [positions, setPositions] = useState<Position[]>([])
  const [totalPnL, setTotalPnL] = useState(0)
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [leverage, setLeverage] = useState(1)

  // Calculate total P&L whenever positions change
  useEffect(() => {
    const total = positions.reduce((sum, position) => sum + position.pnl, 0)
    setTotalPnL(total)
  }, [positions])

  // Initialize trading service
  const initialize = useCallback(async (privateKey?: string) => {
    try {
      setStatus("Initializing demo mode...")

      // Simulate initialization delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Initialize token prices from mock data
      const prices: Record<string, number> = {}
      mockTokens.forEach((token) => {
        const price = typeof token.price === "string" ? Number.parseFloat(token.price.replace(",", "")) : token.price
        prices[token.symbol] = price
      })
      setTokenPrices(prices)

      setIsInitialized(true)
      setIsReady(true)
      setStatus("Demo mode active")

      return true
    } catch (error) {
      console.error("Failed to initialize trading service:", error)
      setStatus("Initialization failed")
      return false
    }
  }, [])

  // Open a new position
  const openPosition = useCallback(
    async (
      symbol: string,
      name: string,
      type: PositionType,
      amount: number,
      price: number,
    ): Promise<Position | null> => {
      try {
        // Get token color from mock data
        const tokenColor = mockTokens.find((t) => t.symbol === symbol)?.color || "#627EEA"

        // Use the current price from tokenPrices if available, otherwise use the provided price
        const actualPrice = tokenPrices[symbol] || price

        // Create new position
        const newPosition: Position = {
          id: uuidv4(),
          symbol,
          name,
          type,
          amount,
          entryPrice: actualPrice,
          currentPrice: actualPrice,
          timestamp: Date.now(),
          pnl: 0,
          pnlPercentage: 0,
          leverage: leverage, // Include the current leverage
          color: tokenColor,
        }

        setPositions((prev) => [...prev, newPosition])
        return newPosition
      } catch (error) {
        console.error("Failed to open position:", error)
        return null
      }
    },
    [tokenPrices, leverage],
  )

  // Close an existing position
  const closePosition = useCallback(async (id: string): Promise<boolean> => {
    try {
      setPositions((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (error) {
      console.error("Failed to close position:", error)
      return false
    }
  }, [])

  // Update token price and recalculate P&L for all positions with that token
  const updateTokenPrice = useCallback((symbol: string, price: number) => {
    setTokenPrices((prev) => ({
      ...prev,
      [symbol]: price,
    }))

    setPositions((prev) =>
      prev.map((position) => {
        if (position.symbol === symbol) {
          // Calculate P&L based on position type and leverage
          let pnl = 0
          let pnlPercentage = 0

          if (position.type === "long") {
            // For long positions: profit when price goes up
            pnlPercentage = (price / position.entryPrice - 1) * 100 * position.leverage
            pnl = position.amount * (price / position.entryPrice - 1) * position.leverage
          } else {
            // For short positions: profit when price goes down
            pnlPercentage = (1 - price / position.entryPrice) * 100 * position.leverage
            pnl = position.amount * (1 - price / position.entryPrice) * position.leverage
          }

          return {
            ...position,
            currentPrice: price,
            pnl,
            pnlPercentage,
          }
        }
        return position
      }),
    )
  }, [])

  // Get all positions for a specific token
  const getPositionsForToken = useCallback(
    (symbol: string) => {
      return positions.filter((p) => p.symbol === symbol)
    },
    [positions],
  )

  // Context value
  const value = {
    isInitialized,
    isReady,
    status,
    positions,
    totalPnL,
    leverage,
    setLeverage,
    initialize,
    openPosition,
    closePosition,
    updateTokenPrice,
    getPositionsForToken,
  }

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

// Custom hook to use the trading context
export function useTrading() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error("useTrading must be used within a TradingProvider")
  }
  return context
}
