"use client"

import { ChevronDown } from "lucide-react"

interface HeaderProps {
  amount: string
  setAmount: (amount: string) => void
}

export default function Header({ amount, setAmount }: HeaderProps) {
  return (
    <header className="p-6 pt-12">
      <h1 className="text-4xl font-bold text-black mb-6">Discover</h1>

      <div className="flex items-center gap-2">
        <span className="text-black/70 text-lg">Amount:</span>
        <button
          className="flex items-center gap-2 text-black text-lg font-semibold"
          onClick={() => setAmount(amount === "10 USDC" ? "50 USDC" : "10 USDC")}
        >
          {amount}
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
