"use client"

import { useState } from "react"
import TokenCard from "@/components/token-card"
import BottomNav from "@/components/bottom-nav"
import Header from "@/components/header"
import { mockTokens } from "@/lib/mock-data"

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [amount, setAmount] = useState("10 USDC")

  const handleSwipe = (direction: "left" | "right", tokenSymbol: string) => {
    const action = direction === "right" ? "BUY" : "SELL"
    console.log(`${action} ${tokenSymbol}`)

    // Move to next card
    setCurrentIndex((prev) => (prev + 1) % mockTokens.length)
  }

  const currentToken = mockTokens[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col">
      <Header amount={amount} setAmount={setAmount} />

      <main className="flex-1 flex items-center justify-center p-4 pb-24">
        <div className="w-full max-w-sm">
          <TokenCard token={currentToken} onSwipe={handleSwipe} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
