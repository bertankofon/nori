"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useTrading } from "@/contexts/TradingContext"

export default function TradingSetup() {
  const [privateKey, setPrivateKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { initializeTrading, status, setIsInitialized } = useTrading()

  const handleInitialize = async () => {
    if (!privateKey.trim()) {
      setError("Please enter a private key")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("🚀 TradingSetup: Starting initialization process...")
      const success = await initializeTrading(privateKey)
      console.log("📊 TradingSetup: Initialization result:", success)

      if (!success) {
        setError("Failed to initialize trading service. Check console for details.")
      }
    } catch (err) {
      console.error("💥 TradingSetup: Initialization error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomKey = () => {
    // Generate a random private key for demo purposes
    const randomKey = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    setPrivateKey(randomKey)
  }

  const handleDemoMode = () => {
    console.log("🎮 TradingSetup: Activating demo mode...")
    setIsInitialized(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Trading</h1>
            <p className="text-gray-600">Initialize your Yellow trading session to start opening positions</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Private Key</label>
              <Input
                type="password"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full"
              />
              <button
                type="button"
                onClick={generateRandomKey}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                Generate random key for demo
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleInitialize}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Trading"
                )}
              </Button>

              <Button onClick={handleDemoMode} variant="outline" className="w-full">
                Skip Setup (Demo Mode)
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>⚠️ Demo mode simulates trading without real transactions</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>ClearNode Connection:</span>
              <div className="flex items-center gap-1">
                {status.connected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={status.connected ? "text-green-600" : "text-red-600"}>
                  {status.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Authentication:</span>
              <div className="flex items-center gap-1">
                {status.authenticated ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={status.authenticated ? "text-green-600" : "text-red-600"}>
                  {status.authenticated ? "Authenticated" : "Not Authenticated"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Trading Session:</span>
              <div className="flex items-center gap-1">
                {status.sessionActive ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={status.sessionActive ? "text-green-600" : "text-red-600"}>
                  {status.sessionActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>⚠️ This is a demo. Never use real private keys in production.</p>
            <p>
              Create your channel at{" "}
              <a
                href="https://apps.yellow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                apps.yellow.com
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
