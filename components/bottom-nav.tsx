"use client"

import { Home, TrendingUp, User } from "lucide-react"

interface BottomNavProps {
  activeTab?: "discover" | "positions" | "profile"
  onTabChange?: (tab: "discover" | "positions" | "profile") => void
}

export default function BottomNav({ activeTab = "discover", onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-area-pb">
      <div className="flex justify-around items-center h-16 px-4">
        <button
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            activeTab === "discover" ? "text-yellow-500" : "text-gray-500"
          }`}
          onClick={() => onTabChange?.("discover")}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Discover</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            activeTab === "positions" ? "text-yellow-500" : "text-gray-500"
          }`}
          onClick={() => onTabChange?.("positions")}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs mt-1">Positions</span>
        </button>
        <button
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            activeTab === "profile" ? "text-yellow-500" : "text-gray-500"
          }`}
          onClick={() => onTabChange?.("profile")}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  )
}
