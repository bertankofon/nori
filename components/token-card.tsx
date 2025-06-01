"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { X, Heart, TrendingUp, BarChart3, RefreshCw } from "lucide-react"
import { useEthereumData, usePumpTokenData, useFlowToken1Data } from "@/hooks/useTokenData"
import { geckoTerminalService } from "@/services/geckoTerminalService"
import type { Token } from "@/lib/types"
import { useTrading } from "@/contexts/TradingContext"

interface TokenCardProps {
  token: Token
  onSwipe: (direction: "left" | "right" | "pass", tokenSymbol: string) => void
  isReady?: boolean
  currentIndex?: number
  totalTokens?: number
}

// Chain configuration for display
const CHAIN_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  eth: { name: "Ethereum", color: "#627EEA", icon: "Ξ" },
  solana: { name: "Solana", color: "#9945FF", icon: "◎" },
  avax: { name: "Avalanche", color: "#E84142", icon: "▲" },
  bsc: { name: "BSC", color: "#F3BA2F", icon: "B" },
  base: { name: "Base", color: "#0052FF", icon: "⬟" },
  arbitrum: { name: "Arbitrum", color: "#2D374B", icon: "◆" },
  "flow-evm": { name: "Flow", color: "#00D4AA", icon: "◉" },
}

// Token to chain mapping
const TOKEN_CHAIN_MAP: Record<string, string> = {
  ETH: "eth",
  PEPE: "eth",
  "ETH-1": "eth",
  SOL: "solana",
  WIF: "solana",
  "SOL-1": "solana",
  WAVAX: "avax",
  COQ: "avax",
  "AVAX-1": "avax",
  "BSC-1": "bsc",
  "BASE-1": "base",
  ARB: "arbitrum",
  PUMP: "flow-evm",
  FLOW1: "flow-evm",
  FLOW2: "flow-evm",
  FLOW3: "flow-evm",
  FLOW4: "flow-evm",
}

export default function TokenCard({
  token,
  onSwipe,
  isReady = false,
  currentIndex = 0,
  totalTokens = 3,
}: TokenCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })

  // Use different hooks based on token symbol
  const { data: ethData, loading: ethLoading, error: ethError, refetch: ethRefetch } = useEthereumData()
  const { data: pumpData, loading: pumpLoading, error: pumpError, refetch: pumpRefetch } = usePumpTokenData()
  const { data: flow1Data, loading: flow1Loading, error: flow1Error, refetch: flow1Refetch } = useFlowToken1Data()

  // Add this line after the existing hooks
  const { status, updateTokenPrice } = useTrading()

  // Determine which data to use based on token symbol
  let tokenData = null
  let loading = false
  let error = null
  let refetch = () => Promise.resolve()

  if (token.symbol === "ETH") {
    tokenData = ethData
    loading = ethLoading
    error = ethError
    refetch = ethRefetch
  } else if (token.symbol === "PUMP") {
    tokenData = pumpData
    loading = pumpLoading
    error = pumpError
    refetch = pumpRefetch
  } else if (token.symbol === "FLOW1") {
    tokenData = flow1Data
    loading = flow1Loading
    error = flow1Error
    refetch = flow1Refetch
  }

  // Get chain info for this token
  const chainId = TOKEN_CHAIN_MAP[token.symbol] || "eth"
  const chainInfo = CHAIN_CONFIG[chainId]

  // Update token price in context when it changes
  useEffect(() => {
    if (tokenData && tokenData.price) {
      updateTokenPrice(token.symbol, tokenData.price)
    }
  }, [tokenData, token.symbol, updateTokenPrice])

  console.log(`TokenCard for ${token.symbol}:`, { tokenData, loading, error })

  // Update token data with real data if available
  const displayToken = tokenData
    ? {
        ...token,
        name: tokenData.name,
        price: geckoTerminalService.formatPrice(tokenData.price),
        change24h: tokenData.change24h,
        volume24h: geckoTerminalService.formatNumber(tokenData.volume24h),
        marketCap: geckoTerminalService.formatNumber(tokenData.marketCap),
      }
    : token

  const currentPrice = tokenData ? tokenData.price : Number.parseFloat(token.price)

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return

    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y

    setDragOffset({ x: deltaX, y: deltaY })
    setRotation(deltaX * 0.1)
  }

  const handleEnd = () => {
    if (!isDragging) return

    const threshold = 80
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left"
      onSwipe(direction, token.symbol)
    }

    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  if (loading) {
    return (
      <Card className="w-full max-w-sm mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <div className="p-4 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 text-sm">Loading {token.symbol} data...</p>
          </div>
        </div>
      </Card>
    )
  }

  const getOverlayColor = () => {
    if (dragOffset.x > 50) return "bg-green-500/20"
    if (dragOffset.x < -50) return "bg-red-500/20"
    return "bg-transparent"
  }

  const getOverlayText = () => {
    if (dragOffset.x > 50) return "LONG"
    if (dragOffset.x < -50) return "SHORT"
    return ""
  }

  // Helper function to determine if price is very small
  const isVerySmallPrice = tokenData && tokenData.price < 0.01

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Token indicator */}
      <div className="absolute -top-6 left-0 right-0 flex justify-center items-center gap-1 text-white">
        {Array.from({ length: totalTokens }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? "bg-white" : "bg-white/30"}`} />
        ))}
      </div>

      <Card
        ref={cardRef}
        className={`w-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isDragging ? "scale-105" : "hover:scale-102"
        }`}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
      >
        {/* Overlay for swipe feedback */}
        <div
          className={`absolute inset-0 rounded-lg ${getOverlayColor()} flex items-center justify-center z-10 transition-all duration-200`}
        >
          {getOverlayText() && <span className="text-xl font-bold text-white">{getOverlayText()}</span>}
        </div>

        <div className="p-4 space-y-4">
          {/* Token Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: token.color }}
              >
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{displayToken.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600 text-sm">{displayToken.symbol}</p>
                  {/* Chain indicator */}
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: chainInfo.color }}
                      title={chainInfo.name}
                    >
                      {chainInfo.icon}
                    </div>
                    <span className="text-xs text-gray-500">{chainInfo.name}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end">
                <div
                  className={`text-xs px-2 py-1 rounded-full mb-1 ${
                    isReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {isReady ? "Ready" : "Setup"}
                </div>
                <p className={`font-bold text-gray-900 ${isVerySmallPrice ? "text-base" : "text-xl"}`}>
                  ${displayToken.price}
                </p>
                {isVerySmallPrice && <p className="text-xs text-gray-500 mt-1">Micro-cap</p>}
              </div>
              <p
                className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 ${
                  displayToken.change24h >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                }`}
              >
                {displayToken.change24h >= 0 ? "+" : ""}
                {typeof displayToken.change24h === "number"
                  ? displayToken.change24h.toFixed(2)
                  : displayToken.change24h}
                %
              </p>
            </div>
          </div>

          {/* Price Chart */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Price Chart (24h)</h3>
            <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 300 100" className="text-green-500">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points={token.chartData} />
              </svg>
            </div>
          </div>

          {/* Token Stats - Simplified to only show volume and market cap */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Token Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg flex items-center">
                <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-600">24h Volume</p>
                  <p className="text-sm font-bold text-gray-900">${displayToken.volume24h}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-600">Market Cap</p>
                  <p className="text-sm font-bold text-gray-900">${displayToken.marketCap}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-2">
            <button
              className="w-14 h-14 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onSwipe("left", token.symbol)
              }}
              style={{
                background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
              }}
            >
              <X className="w-6 h-6 text-red-600" />
            </button>
            <button
              className="w-14 h-14 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onSwipe("pass", token.symbol)
              }}
              style={{
                background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
              }}
            >
              <Heart className="w-6 h-6 text-pink-600" />
            </button>
            <button
              className="w-14 h-14 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onSwipe("right", token.symbol)
              }}
              style={{
                background: "linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)",
              }}
            >
              <TrendingUp className="w-6 h-6 text-green-600" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
