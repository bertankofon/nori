"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface HeaderProps {
  amount: string
  setAmount: (amount: string) => void
}

export default function Header({ amount, setAmount }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const predefinedAmounts = ["1 USDC", "5 USDC", "10 USDC", "50 USDC"]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customValue) {
      setAmount(`${customValue} USDC`)
      setIsCustom(false)
      setIsOpen(false)
    }
  }

  return (
    <header className="p-6 pt-12">
      <h1 className="text-4xl font-bold text-black mb-6">Discover</h1>

      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <span className="text-black/70 text-lg">Amount:</span>
        <button
          className="flex items-center gap-2 text-black text-lg font-semibold"
          onClick={() => setIsOpen(!isOpen)}
        >
          {amount}
          <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "transform rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-md overflow-hidden z-10 min-w-[200px]">
            {predefinedAmounts.map((amt) => (
              <button
                key={amt}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setAmount(amt)
                  setIsOpen(false)
                }}
              >
                {amt}
              </button>
            ))}
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors border-t border-gray-200"
              onClick={() => setIsCustom(true)}
            >
              Custom amount
            </button>

            {isCustom && (
              <form onSubmit={handleCustomSubmit} className="p-2 border-t border-gray-200">
                <div className="flex">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full rounded-r-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-yellow-500 text-white px-3 rounded-r-md"
                  >
                    Set
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
