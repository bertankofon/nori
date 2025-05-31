"use client"

import { useState, useEffect, useCallback } from "react"
import { geckoTerminalService, type TokenData } from "@/services/geckoTerminalService"

interface UseEthereumDataReturn {
  data: TokenData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEthereumData(): UseEthereumDataReturn {
  const [data, setData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Hook: Starting to fetch ETH data...")
      const ethData = await geckoTerminalService.getEthereumData()
      console.log("Hook: Received ETH data:", ethData)
      setData(ethData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch Ethereum data"
      setError(errorMessage)
      console.error("Hook: Error fetching Ethereum data:", err)

      // Set fallback data even on error
      setData({
        symbol: "ETH",
        name: "Ethereum",
        price: 3500,
        change24h: 2.5,
        volume24h: 15000000000,
        marketCap: 420000000000,
        lastUpdated: Date.now(),
        address: "0x0000000000000000000000000000000000000000",
        network: "eth",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchData, 120000)

    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch }
}
