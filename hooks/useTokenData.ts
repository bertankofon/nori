"use client"

import { useState, useEffect, useCallback } from "react"
import { geckoTerminalService, type TokenData } from "@/services/geckoTerminalService"

interface UseTokenDataReturn {
  data: TokenData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTokenData(network: string, address: string, fallbackSymbol: string): UseTokenDataReturn {
  const [data, setData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Hook: Starting to fetch token data for ${network}:${address}...`)
      const tokenData = await geckoTerminalService.getTokenData(network, address)
      console.log(`Hook: Received token data:`, tokenData)
      setData(tokenData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch token data for ${network}:${address}`
      setError(errorMessage)
      console.error(`Hook: Error fetching token data:`, err)

      // Only set fallback data if we absolutely can't get real data
      setData({
        symbol: fallbackSymbol,
        name: `${fallbackSymbol} Token`,
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
  }, [network, address, fallbackSymbol])

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

// Hook to get all tokens data at once
export function useAllTokensData() {
  const [data, setData] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching all tokens data...")
      const allTokensData = await geckoTerminalService.getAllTokensData()
      console.log("Received all tokens data:", allTokensData)
      setData(allTokensData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch tokens data"
      setError(errorMessage)
      console.error("Error fetching all tokens data:", err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()

    // Set up auto-refresh every 5 minutes for all tokens
    const interval = setInterval(fetchAllData, 300000)

    return () => clearInterval(interval)
  }, [fetchAllData])

  return { data, loading, error, refetch: fetchAllData }
}

// Individual token hooks using real addresses
export function useEthereumData(): UseTokenDataReturn {
  return useTokenData("eth", "0x0000000000000000000000000000000000000000", "ETH")
}

export function usePumpTokenData(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x68eb683a393c8a1c816255b4fc4b89d73c52ad4b", "PUMP")
}

export function useFlowToken1Data(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb", "FLOW1")
}

export function useFlowToken2Data(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x995258cea49c25595cd94407fad9e99b81406a84", "FLOW2")
}

export function useFlowToken3Data(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0xd8ad8ae8375aa31bff541e17dc4b4917014ebdaa", "FLOW3")
}

export function useFlowToken4Data(): UseTokenDataReturn {
  return useTokenData("flow-evm", "0x169bb04590fbf18b09739f951274aa5650dfccde", "FLOW4")
}

export function useWrappedSolData(): UseTokenDataReturn {
  return useTokenData("solana", "So11111111111111111111111111111111111111112", "SOL")
}

export function useWifData(): UseTokenDataReturn {
  return useTokenData("solana", "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", "WIF")
}

export function useSolanaToken1Data(): UseTokenDataReturn {
  return useTokenData("solana", "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", "SOL1")
}

export function useWrappedAvaxData(): UseTokenDataReturn {
  return useTokenData("avax", "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", "WAVAX")
}

export function useCoqData(): UseTokenDataReturn {
  return useTokenData("avax", "0x420fca0121dc28039145009570975747295f2329", "COQ")
}

export function useAvaxToken1Data(): UseTokenDataReturn {
  return useTokenData("avax", "0xffff003a6bad9b743d658048742935fffe2b6ed7", "AVAX1")
}

export function useBscToken1Data(): UseTokenDataReturn {
  return useTokenData("bsc", "0x55ad16bd573b3365f43a9daeb0cc66a73821b4a5", "BSC1")
}

export function usePepeData(): UseTokenDataReturn {
  return useTokenData("eth", "0x6982508145454ce325ddbe47a25d4ec3d2311933", "PEPE")
}

export function useEthToken1Data(): UseTokenDataReturn {
  return useTokenData("eth", "0x26e550ac11b26f78a04489d5f20f24e3559f7dd9", "ETH1")
}

export function useBaseToken1Data(): UseTokenDataReturn {
  return useTokenData("base", "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b", "BASE1")
}

export function useArbData(): UseTokenDataReturn {
  return useTokenData("arbitrum", "0x912ce59144191c1204e64559fe8253a0e49e6548", "ARB")
}
