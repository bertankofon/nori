"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import ChainFilter from "./chain-filter"

interface HeaderProps {
  amount: string
  setAmount: (amount: string) => void
  leverage: number
  setLeverage: (leverage: number) => void
  selectedChains: string[]
  onChainsChange: (chains: string[]) => void
}

export default function Header({
  amount,
  setAmount,
  leverage,
  setLeverage,
  selectedChains,
  onChainsChange,
}: HeaderProps) {
  const [sliderValue, setSliderValue] = useState([10])

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
    setAmount(`${value[0]} USDC`)
  }

  const leverageOptions = [1, 2, 5]

  return (
    <header className="bg-white/10 backdrop-blur-md p-4 safe-area-pt">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Name */}
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 flex items-center justify-center">
            <img src="/logo.png" alt="TradeLayer Logo" className="w-full h-full" />
          </div>
          <h1 className="text-lg font-bold text-white">TradeLayer</h1>
        </div>

        {/* Center: Trade Amount and Leverage */}
        <div className="flex items-center gap-3">
          {/* Trade Amount */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm">
                {amount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Trade Amount</h4>
                <div className="flex items-center gap-2">
                  <Slider
                    value={sliderValue}
                    onValueChange={handleSliderChange}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={sliderValue[0]}
                    onChange={(e) => handleSliderChange([Number.parseInt(e.target.value) || 0])}
                    className="w-20"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Leverage Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white/20 text-white border-0 hover:bg-white/30 text-sm">
                {leverage}x
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="center">
              <div className="space-y-3">
                <h4 className="font-medium leading-none">Leverage</h4>
                <div className="flex gap-2">
                  {leverageOptions.map((option) => (
                    <Button
                      key={option}
                      variant={leverage === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLeverage(option)}
                      className="flex-1"
                    >
                      {option}x
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Higher leverage increases both potential profits and losses</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right: Chain Filter */}
        <div>
          <ChainFilter selectedChains={selectedChains} onChainsChange={onChainsChange} />
        </div>
      </div>
    </header>
  )
}
