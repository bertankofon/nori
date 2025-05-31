"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { X, Heart, DollarSign, TrendingUp, BarChart3, Trophy, RefreshCw } from "lucide-react"
import { useEthereumData, usePumpTokenData, useFlowToken1Data } from "@/hooks/useTokenData"
import { geckoTerminalService } from "@/services/geckoTerminalService"
import type { Token } from "@/lib/types"
import { useTrading } from "@/contexts/TradingContext"

interface TokenCardProps {
  token: Token
  onSwipe: (direction: "left" | "right", tokenSymbol: string) => void
  isReady?: boolean
}

export default function TokenCard({ token, onSwipe, isReady = false }: TokenCardProps) {
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
  const { status } = useTrading()

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

    const threshold = 100
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
      <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Loading {token.symbol} data...</p>
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
    if (dragOffset.x > 50) return "BUY"
    if (dragOffset.x < -50) return "SELL"
    return ""
  }

  // Helper function to determine if price is very small
  const isVerySmallPrice = tokenData && tokenData.price < 0.01

  return (
    <div className="relative">
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
          {getOverlayText() && <span className="text-2xl font-bold text-white">{getOverlayText()}</span>}
        </div>

        <div className="p-6 space-y-6">
          {/* Token Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: token.color }}
              >
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{displayToken.name}</h2>
                <p className="text-gray-600">{displayToken.symbol}</p>
                {tokenData && (
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(tokenData.lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end">
                <div
                  className={`text-xs px-2 py-1 rounded-full mb-2 ${
                    isReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {isReady ? "Trading Ready" : "Setup Required"}
                </div>
                <p className={`font-bold text-gray-900 ${isVerySmallPrice ? "text-lg" : "text-2xl"}`}>
                  ${displayToken.price}
                </p>
                {isVerySmallPrice && <p className="text-xs text-gray-500 mt-1">Micro-cap token</p>}
              </div>
              <p
                className={`text-sm font-semibold px-2 py-1 rounded-full mt-2 ${
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Chart (24h)</h3>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 300 100" className="text-green-500">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" points={token.chartData} />
              </svg>
            </div>
          </div>

          {/* Token Stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Token Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900">${displayToken.volume24h}</p>
                <p className="text-xs text-gray-600">24h Vol</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900">${displayToken.marketCap}</p>
                <p className="text-xs text-gray-600">Market Cap</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <Trophy className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900">#{token.rank}</p>
                <p className="text-xs text-gray-600">Rank</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 pt-4">
            <button
              className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
              onClick={() => onSwipe("left", token.symbol)}
            >
              <X className="w-8 h-8 text-red-600" />
            </button>
            <button
              className="w-16 h-16 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center transition-colors"
              onClick={() => console.log("Add to watchlist")}
            >
              <Heart className="w-8 h-8 text-pink-600" />
            </button>
            <button
              className="w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
              onClick={() => onSwipe("right", token.symbol)}
            >
              <DollarSign className="w-8 h-8 text-green-600" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
