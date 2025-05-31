"use client"

import { TrendingUp, Wallet, User } from "lucide-react"

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        <button className="flex flex-col items-center gap-1 p-3 text-green-600">
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium">Discover</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-xs font-medium">My Assets</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  )
}
