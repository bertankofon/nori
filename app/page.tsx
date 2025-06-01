"use client"

import { useState, useEffect } from "react"
import TokenCard from "@/components/token-card"
import BottomNav from "@/components/bottom-nav"
import Header from "@/components/header"
import TradingSetupWithMetaMask from "@/components/TradingSetupWithMetaMask"
import { mockTokens } from "@/lib/mock-data"
import { TradingProvider, useTrading } from "@/contexts/TradingContext"
import Positions from "@/components/my-assets"
import { Card } from "@/components/ui/card"
import PoweredFooter from "@/components/powered-footer"

function HomeContent() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [amount, setAmount] = useState("10 USDC")
  const [leverage, setLeverage] = useState(1)
  const [activeTab, setActiveTab] = useState<"discover" | "positions" | "profile">("discover")
  const [selectedChains, setSelectedChains] = useState<string[]>([
    "eth",
    "solana",
    "avax",
    "bsc",
    "base",
    "arbitrum",
    "flow-evm",
  ])
  const { isInitialized, isReady, openPosition, updateTokenPrice } = useTrading()

  // Filter tokens based on selected chains
  const getTokensByChain = (chainId: string) => {
    const chainTokenMap: Record<string, string[]> = {
      eth: ["ETH", "PEPE", "ETH-1"],
      solana: ["SOL", "WIF", "SOL-1"],
      avax: ["WAVAX", "COQ", "AVAX-1"],
      bsc: ["BSC-1"],
      base: ["BASE-1"],
      arbitrum: ["ARB"],
      "flow-evm": ["PUMP", "FLOW1", "FLOW2", "FLOW3", "FLOW4"],
    }

    return mockTokens.filter((token) => chainTokenMap[chainId]?.includes(token.symbol) || false)
  }

  const availableTokens = selectedChains.length > 0 ? selectedChains.flatMap(getTokensByChain) : mockTokens

  // Reset current index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= availableTokens.length && availableTokens.length > 0) {
      setCurrentIndex(0)
    }
  }, [availableTokens.length, currentIndex])

  const handleSwipe = async (direction: "left" | "right" | "pass", tokenSymbol: string) => {
    if (direction === "pass") {
      // Just move to next card without opening position
      setCurrentIndex((prev) => (prev + 1) % availableTokens.length)
      return
    }

    if (!isReady) {
      console.log("Trading service not ready")
      return
    }

    const action = direction === "right" ? "long" : "short"
    const currentToken = availableTokens[currentIndex]

    // Parse amount (remove "USDC" and convert to number)
    const usdcAmount = Number.parseFloat(amount.replace(" USDC", "")) * leverage

    // Get current price (you'll need to get this from your token data)
    const currentPrice = Number.parseFloat(currentToken.price.replace(",", ""))

    console.log(`Opening ${action} position for ${tokenSymbol} with ${usdcAmount} USDC at $${currentPrice}`)

    try {
      const position = await openPosition(tokenSymbol, currentToken.name, action, usdcAmount, currentPrice)

      if (position) {
        console.log("Position opened successfully:", position)

        // Update token price for real-time P&L calculation
        updateTokenPrice(tokenSymbol, currentPrice)
      } else {
        console.error("Failed to open position")
      }
    } catch (error) {
      console.error("Error opening position:", error)
    }

    // Move to next card
    setCurrentIndex((prev) => (prev + 1) % availableTokens.length)
  }

  const currentToken = availableTokens[currentIndex]

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col items-center justify-center p-4">
        <div className="flex-1 flex items-center justify-center">
          <TradingSetupWithMetaMask />
        </div>
        <PoweredFooter />
      </div>
    )
  }

  if (availableTokens.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col font-poppins">
        <Header
          amount={amount}
          setAmount={setAmount}
          leverage={leverage}
          setLeverage={setLeverage}
          selectedChains={selectedChains}
          onChainsChange={setSelectedChains}
        />
        <main className="flex-1 flex items-center justify-center p-4 pb-24">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Tokens Available</h2>
              <p className="text-gray-600">Please select at least one chain to see tokens</p>
            </div>
          </Card>
        </main>
        <PoweredFooter />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col font-poppins">
      {activeTab === "discover" && (
        <>
          <Header
            amount={amount}
            setAmount={setAmount}
            leverage={leverage}
            setLeverage={setLeverage}
            selectedChains={selectedChains}
            onChainsChange={setSelectedChains}
          />
          <main className="flex-1 flex flex-col items-center">
            <div className="flex-1 flex items-center justify-center p-4 w-full">
              <div className="w-full">
                <TokenCard
                  token={currentToken}
                  onSwipe={handleSwipe}
                  isReady={isReady}
                  currentIndex={currentIndex}
                  totalTokens={availableTokens.length}
                />
              </div>
            </div>
            <PoweredFooter />
          </main>
        </>
      )}

      {activeTab === "positions" && <Positions />}

      {activeTab === "profile" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">TL</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile</h2>
                <p className="text-gray-600">Coming soon...</p>
              </div>
            </Card>
          </div>
          <PoweredFooter />
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
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
