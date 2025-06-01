"use client"

import { useState, useEffect } from "react"
import BottomNav from "@/components/bottom-nav"
import Header from "@/components/header"
import TradingSetupWithMetaMask from "@/components/TradingSetupWithMetaMask"
import RealTokenCard from "@/components/real-token-card"
import { TradingProvider, useTrading } from "@/contexts/TradingContext"
import Positions from "@/components/my-assets"
import { Card } from "@/components/ui/card"
import PoweredFooter from "@/components/powered-footer"
import { useAllTokensData } from "@/hooks/useTokenData"
import type { TokenData } from "@/services/geckoTerminalService"

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

  // Fetch real token data from API
  const { data: allTokensData, loading: tokensLoading, error: tokensError } = useAllTokensData()

  // Filter tokens based on selected chains
  const getTokensByChain = (chainId: string, tokens: TokenData[]) => {
    return tokens.filter((token) => token.network === chainId)
  }

  const availableTokens =
    selectedChains.length > 0
      ? selectedChains.flatMap((chainId) => getTokensByChain(chainId, allTokensData))
      : allTokensData

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

    // Get current price from real API data
    const currentPrice = currentToken.price

    console.log(
      `Opening ${action} position for ${tokenSymbol} (${currentToken.name}) with ${usdcAmount} USDC at $${currentPrice}`,
    )

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

  if (tokensLoading) {
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Tokens</h2>
              <p className="text-gray-600">Fetching real token data from API...</p>
            </div>
          </Card>
        </main>
        <PoweredFooter />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  if (tokensError || availableTokens.length === 0) {
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {tokensError ? "Error Loading Tokens" : "No Tokens Available"}
              </h2>
              <p className="text-gray-600">
                {tokensError ? "Failed to fetch token data from API" : "Please select at least one chain to see tokens"}
              </p>
              {tokensError && <p className="text-red-600 text-sm mt-2">{tokensError}</p>}
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
                <RealTokenCard
                  tokenData={currentToken}
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
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <img src="/logo.png" alt="TradeLayer Logo" className="w-full h-full" />
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
