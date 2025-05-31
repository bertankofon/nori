"use client"

import { useState } from "react"
import TokenCard from "@/components/token-card"
import BottomNav from "@/components/bottom-nav"
import Header from "@/components/header"
import TradingSetup from "@/components/trading-setup"
import PositionsPanel from "@/components/positions-panel"
import { mockTokens } from "@/lib/mock-data"
import { TradingProvider, useTrading } from "@/contexts/TradingContext"

function HomeContent() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [amount, setAmount] = useState("10 USDC")
  const [showPositions, setShowPositions] = useState(false)
  const { isInitialized, isReady, openPosition, updateTokenPrice } = useTrading()

  const handleSwipe = async (direction: "left" | "right", tokenSymbol: string) => {
    if (!isReady) {
      console.log("Trading service not ready")
      return
    }

    const action = direction === "right" ? "long" : "short"
    const currentToken = mockTokens[currentIndex]

    // Parse amount (remove "USDC" and convert to number)
    const usdcAmount = Number.parseFloat(amount.replace(" USDC", ""))

    // Get current price (you'll need to get this from your token data)
    const currentPrice = Number.parseFloat(currentToken.price.replace(",", ""))

    console.log(`Opening ${action} position for ${tokenSymbol} with ${usdcAmount} USDC at $${currentPrice}`)

    try {
      const position = await openPosition(tokenSymbol, currentToken.name, action, usdcAmount, currentPrice)

      if (position) {
        console.log("Position opened successfully:", position)
      } else {
        console.error("Failed to open position")
      }
    } catch (error) {
      console.error("Error opening position:", error)
    }

    // Move to next card
    setCurrentIndex((prev) => (prev + 1) % mockTokens.length)
  }

  const currentToken = mockTokens[currentIndex]

  if (!isInitialized) {
    return <TradingSetup />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col">
      <Header amount={amount} setAmount={setAmount} showPositions={showPositions} setShowPositions={setShowPositions} />

      {showPositions ? (
        <PositionsPanel onClose={() => setShowPositions(false)} />
      ) : (
        <main className="flex-1 flex items-center justify-center p-4 pb-24">
          <div className="w-full max-w-sm">
            <TokenCard token={currentToken} onSwipe={handleSwipe} isReady={isReady} />
          </div>
        </main>
      )}

      <BottomNav />
    </div>
  )
}

export default function Home() {
  return (
    <TradingProvider>
      <HomeContent />
    </TradingProvider>
  )
}
