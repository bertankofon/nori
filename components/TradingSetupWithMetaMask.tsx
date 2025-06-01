"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTrading } from "@/contexts/TradingContext"
import { Loader2 } from "lucide-react"
import MetaMaskConnect from "./MetaMaskConnect"
import { useMetaMask } from "@/hooks/useMetaMask"

export default function TradingSetupWithMetaMask() {
  const [isLoading, setIsLoading] = useState(false)
  const { initialize } = useTrading()
  const { account, isConnected } = useMetaMask()

  const handleInitialize = async () => {
    setIsLoading(true)
    try {
      await initialize()
    } catch (error) {
      console.error("Failed to initialize trading:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipSetup = async () => {
    setIsLoading(true)
    try {
      // Initialize in demo mode without a private key
      await initialize()
    } catch (error) {
      console.error("Failed to initialize demo mode:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
      <div className="p-6 text-center">
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <img src="/logo.png" alt="TradeLayer Logo" className="w-full h-full" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to TradeLayer</h2>
        <p className="text-gray-600 mb-6">Swipe to trade crypto with leverage</p>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <MetaMaskConnect />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
              <Button variant="outline" onClick={handleSkipSetup} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Let's Trade!" // Changed from "Try Demo Mode"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700 font-medium">
                  Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
              </div>
              <Button
                onClick={handleInitialize}
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Start Trading"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
