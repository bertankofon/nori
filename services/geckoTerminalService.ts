interface GeckoTerminalTokenResponse {
  data: {
    id: string
    type: string
    attributes: {
      address: string
      name: string
      symbol: string
      decimals: number
      image_url: string | null
      coingecko_coin_id: string | null
      total_supply: string
      normalized_total_supply: string
      price_usd: string
      fdv_usd: string
      total_reserve_in_usd: string
      volume_usd: {
        h24: string
      }
      market_cap_usd: string | null
    }
    relationships: {
      top_pools: {
        data: Array<{
          id: string
          type: string
        }>
      }
    }
  }
}

export interface TokenData {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  lastUpdated: number
  imageUrl?: string
  address: string
  network: string
}

export interface TokenConfig {
  network: string
  address: string
  fallbackSymbol: string
  fallbackName: string
}

class GeckoTerminalService {
  private baseUrl = "https://api.geckoterminal.com/api/v2"
  private headers = {
    Accept: "application/json;version=20230302",
    "Content-Type": "application/json",
  }

  // Token configurations with addresses only - names and symbols will come from API
  private tokenConfigs: TokenConfig[] = [
    {
      network: "eth",
      address: "0x0000000000000000000000000000000000000000",
      fallbackSymbol: "ETH",
      fallbackName: "Ethereum",
    },
    {
      network: "flow-evm",
      address: "0x6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb",
      fallbackSymbol: "FLOW1",
      fallbackName: "Flow Token 1",
    },
    {
      network: "flow-evm",
      address: "0x68eb683a393c8a1c816255b4fc4b89d73c52ad4b",
      fallbackSymbol: "PUMP",
      fallbackName: "pump.flow",
    },
    {
      network: "flow-evm",
      address: "0x995258cea49c25595cd94407fad9e99b81406a84",
      fallbackSymbol: "FLOW2",
      fallbackName: "Flow Token 2",
    },
    {
      network: "flow-evm",
      address: "0xd8ad8ae8375aa31bff541e17dc4b4917014ebdaa",
      fallbackSymbol: "FLOW3",
      fallbackName: "Flow Token 3",
    },
    {
      network: "flow-evm",
      address: "0x169bb04590fbf18b09739f951274aa5650dfccde",
      fallbackSymbol: "FLOW4",
      fallbackName: "Flow Token 4",
    },
    {
      network: "solana",
      address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
      fallbackSymbol: "SOL1",
      fallbackName: "Solana Token 1",
    },
    {
      network: "solana",
      address: "So11111111111111111111111111111111111111112",
      fallbackSymbol: "SOL",
      fallbackName: "Wrapped SOL",
    },
    {
      network: "solana",
      address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      fallbackSymbol: "WIF",
      fallbackName: "dogwifhat",
    },
    {
      network: "avax",
      address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      fallbackSymbol: "WAVAX",
      fallbackName: "Wrapped AVAX",
    },
    {
      network: "avax",
      address: "0xffff003a6bad9b743d658048742935fffe2b6ed7",
      fallbackSymbol: "AVAX1",
      fallbackName: "Avalanche Token 1",
    },
    {
      network: "avax",
      address: "0x420fca0121dc28039145009570975747295f2329",
      fallbackSymbol: "COQ",
      fallbackName: "Coq Inu",
    },
    {
      network: "bsc",
      address: "0x55ad16bd573b3365f43a9daeb0cc66a73821b4a5",
      fallbackSymbol: "BSC1",
      fallbackName: "BSC Token 1",
    },
    {
      network: "eth",
      address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      fallbackSymbol: "PEPE",
      fallbackName: "Pepe",
    },
    {
      network: "eth",
      address: "0x26e550ac11b26f78a04489d5f20f24e3559f7dd9",
      fallbackSymbol: "ETH1",
      fallbackName: "Ethereum Token 1",
    },
    {
      network: "base",
      address: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
      fallbackSymbol: "BASE1",
      fallbackName: "Base Token 1",
    },
    {
      network: "arbitrum",
      address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
      fallbackSymbol: "ARB",
      fallbackName: "Arbitrum",
    },
  ]

  async getTokenData(network: string, address: string): Promise<TokenData> {
    try {
      console.log(`Fetching token data for ${network}:${address}`)

      const url = `${this.baseUrl}/networks/${network}/tokens/${address}`
      console.log("API URL:", url)

      const response = await fetch(url, { headers: this.headers })
      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("Error response body:", errorText)
        throw new Error(`Failed to fetch token data: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data: GeckoTerminalTokenResponse = await response.json()
      console.log("API Response:", JSON.stringify(data, null, 2))

      const token = data.data
      if (!token || !token.attributes) {
        throw new Error("Invalid token data received")
      }

      const attrs = token.attributes

      // Use the REAL name and symbol from the API response
      const realSymbol = attrs.symbol || "UNKNOWN"
      const realName = attrs.name || "Unknown Token"

      // Extract and parse the data with better precision for small numbers
      const priceString = attrs.price_usd || "0"
      const price = Number.parseFloat(priceString)
      const volume24h = Number.parseFloat(attrs.volume_usd?.h24 || "0")
      const marketCap = Number.parseFloat(attrs.market_cap_usd || attrs.fdv_usd || "0")

      console.log(`Real token data - Symbol: ${realSymbol}, Name: ${realName}, Price: ${price}`)

      return {
        symbol: realSymbol,
        name: realName,
        price: price,
        change24h: 0, // This endpoint doesn't provide 24h change
        volume24h: volume24h,
        marketCap: marketCap,
        lastUpdated: Date.now(),
        imageUrl: attrs.image_url || undefined,
        address: attrs.address,
        network: network,
      }
    } catch (error) {
      console.error(`Error fetching token data for ${network}:${address}:`, error)
      throw error
    }
  }

  // Specific method for Ethereum
  async getEthereumData(): Promise<TokenData> {
    try {
      return await this.getTokenData("eth", "0x0000000000000000000000000000000000000000")
    } catch (error) {
      console.error("Error fetching Ethereum data:", error)

      // Fallback data
      return {
        symbol: "ETH",
        name: "Ethereum",
        price: 3500,
        change24h: 2.5,
        volume24h: 15000000000,
        marketCap: 420000000000,
        lastUpdated: Date.now(),
        address: "0x0000000000000000000000000000000000000000",
        network: "eth",
      }
    }
  }

  // Method to add new tokens
  addTokenConfig(config: TokenConfig): void {
    this.tokenConfigs.push(config)
  }

  // Method to get all configured tokens
  getTokenConfigs(): TokenConfig[] {
    return this.tokenConfigs
  }

  // Method to get token data by symbol (fallback symbol)
  async getTokenDataBySymbol(symbol: string): Promise<TokenData> {
    const config = this.tokenConfigs.find((t) => t.fallbackSymbol.toLowerCase() === symbol.toLowerCase())
    if (!config) {
      throw new Error(`Token configuration not found for symbol: ${symbol}`)
    }
    return await this.getTokenData(config.network, config.address)
  }

  // Method to get all tokens data - this will fetch REAL names and symbols
  async getAllTokensData(): Promise<TokenData[]> {
    const results: TokenData[] = []

    for (const config of this.tokenConfigs) {
      try {
        console.log(`Fetching real data for ${config.network}:${config.address}`)
        const tokenData = await this.getTokenData(config.network, config.address)
        results.push(tokenData)
        console.log(`Successfully fetched: ${tokenData.symbol} (${tokenData.name})`)
      } catch (error) {
        console.error(`Failed to fetch data for ${config.fallbackSymbol}:`, error)
        // Add fallback data for failed tokens
        results.push({
          symbol: config.fallbackSymbol,
          name: config.fallbackName,
          price: 0,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          lastUpdated: Date.now(),
          address: config.address,
          network: config.network,
        })
      }
    }

    return results
  }

  // Enhanced price formatting for better readability
  formatPrice(price: number): string {
    if (price === 0) return "0.00"

    if (price >= 1) {
      // For prices $1 and above, show 2 decimals
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } else if (price >= 0.01) {
      // For prices between $0.01 and $1, show 4 decimals
      return price.toFixed(4)
    } else if (price >= 0.000001) {
      // For very small prices, show 8 decimals with leading zeros
      return price.toFixed(8)
    } else {
      // For extremely small prices, use scientific notation but make it prettier
      const scientific = price.toExponential(3)
      return scientific.replace("e-", " × 10⁻")
    }
  }

  formatNumber(num: number): string {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(2)}K`
    }
    return num.toFixed(2)
  }
}

export const geckoTerminalService = new GeckoTerminalService()
