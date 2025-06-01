"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, Filter } from "lucide-react"

export interface ChainConfig {
  id: string
  name: string
  color: string
  icon: string
}

const AVAILABLE_CHAINS: ChainConfig[] = [
  { id: "eth", name: "Ethereum", color: "#627EEA", icon: "Ξ" },
  { id: "solana", name: "Solana", color: "#9945FF", icon: "◎" },
  { id: "avax", name: "Avalanche", color: "#E84142", icon: "▲" },
  { id: "bsc", name: "BSC", color: "#F3BA2F", icon: "B" },
  { id: "base", name: "Base", color: "#0052FF", icon: "⬟" },
  { id: "arbitrum", name: "Arbitrum", color: "#2D374B", icon: "◆" },
  { id: "flow-evm", name: "Flow", color: "#00D4AA", icon: "◉" },
]

interface ChainFilterProps {
  selectedChains: string[]
  onChainsChange: (chains: string[]) => void
}

export default function ChainFilter({ selectedChains, onChainsChange }: ChainFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      onChainsChange(selectedChains.filter((id) => id !== chainId))
    } else {
      onChainsChange([...selectedChains, chainId])
    }
  }

  const selectAll = () => {
    onChainsChange(AVAILABLE_CHAINS.map((chain) => chain.id))
  }

  const clearAll = () => {
    onChainsChange([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-white/20 text-white border-0 hover:bg-white/30 gap-2">
          <Filter className="w-4 h-4" />
          Chains ({selectedChains.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Chains</h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {AVAILABLE_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => toggleChain(chain.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedChains.includes(chain.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: chain.color }}
                  >
                    {chain.icon}
                  </div>
                  <span className="font-medium">{chain.name}</span>
                </div>
                {selectedChains.includes(chain.id) && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>

          {selectedChains.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600 mb-2">Selected chains:</p>
              <div className="flex flex-wrap gap-1">
                {selectedChains.map((chainId) => {
                  const chain = AVAILABLE_CHAINS.find((c) => c.id === chainId)
                  return chain ? (
                    <Badge key={chainId} variant="secondary" className="text-xs">
                      {chain.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
