"use client"

import { useState, useEffect, useCallback } from "react"
import { geckoTerminalService, type TokenData } from "@/services/geckoTerminalService"

interface UseTokenDataReturn {
  data: TokenData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTokenData(network: string, address: string, symbol: string): UseTokenDataReturn {
  const [data, setData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Hook: Starting to fetch ${symbol} data...`)
      const tokenData = await geckoTerminalService.getTokenData(network, address)
      console.log(`Hook: Received ${symbol} data:`, tokenData)
      setData(tokenData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${symbol} data`
      setError(errorMessage)
      console.error(`Hook: Error fetching ${symbol} data:`, err)

      // Set fallback data even on error
      setData({
        symbol: symbol,
        name: `${symbol} Token`,
        price: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
        address: address,
        network: network,
      })
    } finally {
      setLoading(false)
    }
  }, [network, address, symbol])

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

// Keep the original hook for backward compatibility
export function useEthereumData(): UseTokenDataReturn {
  return useTokenData("eth", "0x0000000000000000000000000000000000000000", "ETH")
}

// New hooks for Flow tokens
export function usePumpTokenData(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x68eb683a393c8a1c816255b4fc4b89d73c52ad4b", "PUMP")
}

export function useFlowToken1Data(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb", "FLOW1")
}
