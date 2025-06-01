"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, DollarSign, ArrowLeft, ArrowRight, X } from "lucide-react"
import type { TokenData } from "@/services/geckoTerminalService"

interface RealTokenCardProps {
  tokenData: TokenData
  onSwipe: (direction: "left" | "right" | "pass", tokenSymbol: string) => void
  isReady: boolean
  currentIndex: number
  totalTokens: number
}

export default function RealTokenCard({ tokenData, onSwipe, isReady, currentIndex, totalTokens }: RealTokenCardProps) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY })
    setIsDragging(true)
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return

    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!dragStart) return

    const threshold = 100
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left"
      onSwipe(direction, tokenData.symbol)
    }

    setDragStart(null)
    setDragOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const formatPrice = (price: number): string => {
    if (price === 0) return "0.00"
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } else if (price >= 0.01) {
      return price.toFixed(4)
    } else if (price >= 0.000001) {
      return price.toFixed(8)
    } else {
      const scientific = price.toExponential(3)
      return scientific.replace("e-", " × 10⁻")
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toFixed(2)
  }

  const getRotation = () => {
    return dragOffset.x * 0.1
  }

  const getOpacity = () => {
    return Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300)
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="text-center mb-4">
        <span className="text-white/80 text-sm font-medium">
          {currentIndex + 1} of {totalTokens}
        </span>
      </div>

      <Card
        className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-200"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
        }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => isDragging && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        <CardContent className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
              {tokenData.imageUrl ? (
                <img
                  src={tokenData.imageUrl || "/placeholder.svg"}
                  alt={tokenData.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base md:text-lg">{tokenData.symbol.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{tokenData.name}</h2>
                <p className="text-gray-600 font-medium text-sm md:text-base">{tokenData.symbol}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl md:text-2xl font-bold text-gray-900">${formatPrice(tokenData.price)}</p>
              <div className="flex items-center justify-end space-x-1">
                {tokenData.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                )}
                <span
                  className={`text-xs md:text-sm font-medium ${tokenData.change24h >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {tokenData.change24h >= 0 ? "+" : ""}
                  {tokenData.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-gray-50 rounded-lg p-2.5 md:p-3">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                <span className="text-xs md:text-sm text-gray-600">Volume 24h</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm md:text-base">${formatNumber(tokenData.volume24h)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 md:p-3">
              <div className="flex items-center space-x-1 md:space-x-2 mb-1">
                <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                <span className="text-xs md:text-sm text-gray-600">Market Cap</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm md:text-base">${formatNumber(tokenData.marketCap)}</p>
            </div>
          </div>

          {/* Network Badge */}
          <div className="mb-6">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {tokenData.network.toUpperCase()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 md:space-x-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-12 md:h-auto text-sm md:text-base"
              onClick={() => onSwipe("left", tokenData.symbol)}
              disabled={!isReady}
            >
              <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
              Short
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-3 md:px-4 border-gray-200 text-gray-600 hover:bg-gray-50 h-12 md:h-auto"
              onClick={() => onSwipe("pass", tokenData.symbol)}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 h-12 md:h-auto text-sm md:text-base"
              onClick={() => onSwipe("right", tokenData.symbol)}
              disabled={!isReady}
            >
              <ArrowRight className="w-4 h-4 mr-1 md:mr-2" />
              Long
            </Button>
          </div>

          {/* Swipe Instructions */}
          <div className="mt-3 md:mt-4 text-center">
            <p className="text-xs text-gray-500">Swipe left to short • Swipe right to long • Tap X to pass</p>
          </div>
        </CardContent>
      </Card>

      {/* Drag Indicators */}
      {isDragging && (
        <>
          {dragOffset.x > 50 && (
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              LONG
            </div>
          )}
          {dragOffset.x < -50 && (
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              SHORT
            </div>
          )}
        </>
      )}
    </div>
  )
}
