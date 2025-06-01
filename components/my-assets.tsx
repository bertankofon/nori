"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowUpRight, X, RefreshCw } from "lucide-react"
import { useTrading } from "@/contexts/TradingContext"
import { formatCurrency } from "@/lib/utils"
import PoweredFooter from "./powered-footer"

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

export default function Positions() {
  const { positions, closePosition, totalPnL, updateTokenPrice } = useTrading()
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update token prices to simulate market movement
      const tokens = [
        "ETH",
        "PUMP",
        "FLOW1",
        "SOL",
        "WIF",
        "WAVAX",
        "COQ",
        "PEPE",
        "ARB",
        "SOL-1",
        "AVAX-1",
        "BSC-1",
        "ETH-1",
        "BASE-1",
      ]
      const randomToken = tokens[Math.floor(Math.random() * tokens.length)]
      const currentPrice = positions.find((p) => p.symbol === randomToken)?.currentPrice || 0
      const change = currentPrice * (0.995 + Math.random() * 0.01) // -0.5% to +0.5%

      if (randomToken && change) {
        updateTokenPrice(randomToken, change)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [positions, updateTokenPrice])

  const handleRefresh = () => {
    setRefreshing(true)

    // Simulate refresh of all token prices
    const tokens = [
      "ETH",
      "PUMP",
      "FLOW1",
      "SOL",
      "WIF",
      "WAVAX",
      "COQ",
      "PEPE",
      "ARB",
      "SOL-1",
      "AVAX-1",
      "BSC-1",
      "ETH-1",
      "BASE-1",
    ]
    tokens.forEach((token) => {
      const position = positions.find((p) => p.symbol === token)
      if (position) {
        const change = position.currentPrice * (0.99 + Math.random() * 0.02) // -1% to +1%
        updateTokenPrice(token, change)
      }
    })

    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleWithdrawRedirect = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
    setIsWithdrawOpen(false)
  }

  const totalValue = positions.reduce((sum, position) => sum + position.amount, 0)

  return (
    <div className="flex-1 flex flex-col p-4 pb-20 overflow-auto safe-area-pt">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Positions</h1>
        <Button
          variant="outline"
          className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm"
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Summary */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg mb-4">
        <div className="p-4">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Portfolio Summary</h2>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total P&L</p>
              <p className={`text-lg font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalPnL >= 0 ? "+" : ""}
                {formatCurrency(totalPnL)}
              </p>
            </div>
          </div>
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600">Withdraw Funds</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-500">Choose a network to withdraw your funds:</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="flex justify-between items-center h-auto py-3"
                    onClick={() => handleWithdrawRedirect("https://apps.yellow.com")}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">USDF on Flow EVM</span>
                      <span className="text-xs text-gray-500">Fast withdrawals, low fees</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex justify-between items-center h-auto py-3"
                    onClick={() => handleWithdrawRedirect("https://apps.yellow.com")}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">USDC on Polygon</span>
                      <span className="text-xs text-gray-500">Wider compatibility</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Positions */}
      <h2 className="text-lg font-semibold text-white mb-3">Open Positions</h2>
      {positions.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <div className="p-6 text-center">
            <p className="text-gray-500">No open positions</p>
            <p className="text-sm text-gray-400 mt-2">Swipe right to go long, left to go short</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 flex-1">
          {positions.map((position) => {
            const chainId = TOKEN_CHAIN_MAP[position.symbol] || "eth"
            const chainInfo = CHAIN_CONFIG[chainId]

            return (
              <Card key={position.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: position.color || "#627EEA" }}
                      >
                        {position.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{position.name}</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{position.symbol}</span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className={`text-xs ${position.type === "long" ? "text-green-600" : "text-red-600"}`}>
                            {position.type.toUpperCase()}
                          </span>
                          <span className="mx-1 text-gray-300">•</span>
                          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {position.leverage || 1}x
                          </span>
                          <span className="mx-1 text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-bold"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => closePosition(position.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Entry Amount</p>
                      <p className="font-medium text-sm">{formatCurrency(position.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entry Price</p>
                      <p className="font-medium text-sm">${position.entryPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Price</p>
                      <p className="font-medium text-sm">${position.currentPrice.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">P&L</p>
                      <p className={`font-medium text-sm ${position.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {position.pnl >= 0 ? "+" : ""}
                        {formatCurrency(position.pnl)}
                        <span className="text-xs ml-1">
                          ({position.pnlPercentage >= 0 ? "+" : ""}
                          {position.pnlPercentage.toFixed(2)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-auto">
        <PoweredFooter />
      </div>
    </div>
  )
}
