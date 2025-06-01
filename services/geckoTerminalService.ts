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
  symbol: string
  name: string
}

class GeckoTerminalService {
  private baseUrl = "https://api.geckoterminal.com/api/v2"
  private headers = {
    Accept: "application/json;version=20230302",
    "Content-Type": "application/json",
  }

  // Predefined token configurations
  private tokenConfigs: TokenConfig[] = [
    {
      network: "eth",
      address: "0x0000000000000000000000000000000000000000", // Native ETH
      symbol: "ETH",
      name: "Ethereum",
    },
    {
      network: "flow-evm",
      address: "0x6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb", // Flow EVM Token 1
      symbol: "FLOW1",
      name: "Flow Token 1",
    },
    {
      network: "flow-evm",
      address: "0x68eb683a393c8a1c816255b4fc4b89d73c52ad4b", // Flow EVM Token 2 (PUMP)
      symbol: "PUMP",
      name: "pump.flow",
    },
    {
      network: "flow-evm",
      address: "0x995258cea49c25595cd94407fad9e99b81406a84", // New Flow EVM Token 3
      symbol: "FLOW2",
      name: "Flow Token 2",
    },
    {
      network: "flow-evm",
      address: "0xd8ad8ae8375aa31bff541e17dc4b4917014ebdaa", // New Flow EVM Token 4
      symbol: "FLOW3",
      name: "Flow Token 3",
    },
    {
      network: "flow-evm",
      address: "0x169bb04590fbf18b09739f951274aa5650dfccde", // New Flow EVM Token 5
      symbol: "FLOW4",
      name: "Flow Token 4",
    },
    // Solana tokens
    {
      network: "solana",
      address: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
      symbol: "SOL-1",
      name: "Solana Token 1",
    },
    {
      network: "solana",
      address: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      name: "Wrapped SOL",
    },
    {
      network: "solana",
      address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat",
    },
    // Avalanche tokens
    {
      network: "avax",
      address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      symbol: "WAVAX",
      name: "Wrapped AVAX",
    },
    {
      network: "avax",
      address: "0xffff003a6bad9b743d658048742935fffe2b6ed7",
      symbol: "AVAX-1",
      name: "Avalanche Token 1",
    },
    {
      network: "avax",
      address: "0x420fca0121dc28039145009570975747295f2329",
      symbol: "COQ",
      name: "Coq Inu",
    },
    // BSC tokens
    {
      network: "bsc",
      address: "0x55ad16bd573b3365f43a9daeb0cc66a73821b4a5",
      symbol: "BSC-1",
      name: "BSC Token 1",
    },
    // Ethereum tokens
    {
      network: "eth",
      address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      symbol: "PEPE",
      name: "Pepe",
    },
    {
      network: "eth",
      address: "0x26e550ac11b26f78a04489d5f20f24e3559f7dd9",
      symbol: "ETH-1",
      name: "Ethereum Token 1",
    },
    // Base tokens
    {
      network: "base",
      address: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
      symbol: "BASE-1",
      name: "Base Token 1",
    },
    // Arbitrum tokens
    {
      network: "arbitrum",
      address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
      symbol: "ARB",
      name: "Arbitrum",
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

      // Extract and parse the data with better precision for small numbers
      const priceString = attrs.price_usd || "0"
      const price = Number.parseFloat(priceString)
      const volume24h = Number.parseFloat(attrs.volume_usd?.h24 || "0")
      const marketCap = Number.parseFloat(attrs.market_cap_usd || attrs.fdv_usd || "0")

      console.log(`Raw price string: "${priceString}"`)
      console.log(`Parsed data - Price: ${price}, Volume: ${volume24h}, MarketCap: ${marketCap}`)

      return {
        symbol: attrs.symbol,
        name: attrs.name,
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

  // Method to get token data by symbol
  async getTokenDataBySymbol(symbol: string): Promise<TokenData> {
    const config = this.tokenConfigs.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase())
    if (!config) {
      throw new Error(`Token configuration not found for symbol: ${symbol}`)
    }
    return await this.getTokenData(config.network, config.address)
  }

  // Method to get all tokens data
  async getAllTokensData(): Promise<TokenData[]> {
    const results: TokenData[] = []

    for (const config of this.tokenConfigs) {
      try {
        const tokenData = await this.getTokenData(config.network, config.address)
        results.push(tokenData)
      } catch (error) {
        console.error(`Failed to fetch data for ${config.symbol}:`, error)
        // Add fallback data for failed tokens
        results.push({
          symbol: config.symbol,
          name: config.name,
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
