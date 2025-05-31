"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { X, Heart, DollarSign, TrendingUp, BarChart3, Trophy } from "lucide-react"
import type { Token } from "@/lib/types"

interface TokenCardProps {
  token: Token
  onSwipe: (direction: "left" | "right", tokenSymbol: string) => void
}

export default function TokenCard({ token, onSwipe }: TokenCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })

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
                <h2 className="text-xl font-bold text-gray-900">{token.name}</h2>
                <p className="text-gray-600">{token.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${token.price}</p>
              <p
                className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  token.change24h >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                }`}
              >
                {token.change24h >= 0 ? "+" : ""}
                {token.change24h}%
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
                <p className="text-sm font-bold text-gray-900">${token.volume24h}</p>
                <p className="text-xs text-gray-600">24h Vol</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900">${token.marketCap}</p>
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
