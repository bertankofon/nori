"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { useTrading } from "@/contexts/TradingContext"
import { useEthereumData, usePumpTokenData, useFlowToken1Data } from "@/hooks/useTokenData"
import { useEffect, useRef } from "react"

interface PositionsPanelProps {
  onClose: () => void
}

export default function PositionsPanel({ onClose }: PositionsPanelProps) {
  const { positions, totalPnL, closePosition, updateTokenPrice } = useTrading()

  // Get real-time price data
  const { data: ethData } = useEthereumData()
  const { data: pumpData } = usePumpTokenData()
  const { data: flow1Data } = useFlowToken1Data()

  // Use refs to track previous prices to avoid unnecessary updates
  const prevEthPrice = useRef<number | null>(null)
  const prevPumpPrice = useRef<number | null>(null)
  const prevFlow1Price = useRef<number | null>(null)

  // Update prices only when they actually change
  useEffect(() => {
    if (ethData && ethData.price !== prevEthPrice.current) {
      prevEthPrice.current = ethData.price
      updateTokenPrice("ETH", ethData.price)
    }
  }, [ethData, updateTokenPrice])

  useEffect(() => {
    if (pumpData && pumpData.price !== prevPumpPrice.current) {
      prevPumpPrice.current = pumpData.price
      updateTokenPrice("PUMP", pumpData.price)
    }
  }, [pumpData, updateTokenPrice])

  useEffect(() => {
    if (flow1Data && flow1Data.price !== prevFlow1Price.current) {
      prevFlow1Price.current = flow1Data.price
      updateTokenPrice("FLOW1", flow1Data.price)
    }
  }, [flow1Data, updateTokenPrice])

  const handleClosePosition = async (positionId: string, currentPrice: number) => {
    await closePosition(positionId, currentPrice)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPnL = (pnl: number) => {
    const formatted = formatCurrency(Math.abs(pnl))
    return pnl >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return (
    <div className="flex-1 p-4 pb-24">
      <Card className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Positions</h2>
              <p className="text-gray-600">
                Total P&L:
                <span className={`ml-2 font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatPnL(totalPnL)}
                </span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Positions List */}
          <div className="space-y-4">
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No open positions</p>
                <p className="text-sm text-gray-500">Swipe right to go long, left to go short</p>
              </div>
            ) : (
              positions.map((position) => (
                <Card key={position.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${position.type === "long" ? "bg-green-100" : "bg-red-100"}`}>
                        {position.type === "long" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {position.tokenSymbol} {position.type.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(position.amount)} • Entry: ${position.entryPrice.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div>
                        <p className="text-xs text-gray-500">Current Price</p>
                        <p className="font-medium text-sm">${position.currentPrice.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">P&L</p>
                        <p className={`font-medium text-sm ${position.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPnL(position.pnl)}
                          <span className="text-xs ml-1">({((position.pnl / position.amount) * 100).toFixed(2)}%)</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClosePosition(position.id, position.currentPrice)}
                        className="mt-2"
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Opened: {new Date(position.timestamp).toLocaleString()}</span>
                      <span>P&L%: {((position.pnl / position.amount) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
