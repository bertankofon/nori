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
      symbol: "FLOW1", // We'll get the real symbol from API
      name: "Flow Token 1", // We'll get the real name from API
    },
    {
      network: "flow-evm",
      address: "0x68eb683a393c8a1c816255b4fc4b89d73c52ad4b", // Flow EVM Token 2 (PUMP)
      symbol: "PUMP", // We know this is PUMP from your API response
      name: "pump.flow", // We know this is pump.flow from your API response
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
