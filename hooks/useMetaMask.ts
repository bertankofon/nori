import { useState, useEffect, useCallback } from "react"
import { createWalletClient, custom } from "viem"
import { polygon } from "viem/chains"
import { Hex } from "viem"
import { setMetaMaskWalletClient } from "@/services/yellowTradingService"

interface UseMetaMaskReturn {
  address: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  walletClient: ReturnType<typeof createWalletClient> | null
}

// Safe access to window.ethereum
const getEthereum = () => {
  if (typeof window !== 'undefined') {
    return (window as any).ethereum
  }
  return undefined
}

export function useMetaMask(): UseMetaMaskReturn {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null)

  const connect = useCallback(async () => {
    try {
      console.log("🔌 useMetaMask: Connect method started")
      setIsLoading(true)
      setError(null)

      const ethereum = getEthereum()
      
      if (!ethereum) {
        const err = new Error("MetaMask is not installed. Please install MetaMask extension.")
        console.error("🔌 useMetaMask:", err.message)
        throw err
      }

      console.log("🔌 useMetaMask: Ethereum object found:", ethereum)
      console.log("🔌 useMetaMask: isMetaMask property:", ethereum.isMetaMask)

      // Force a provider reload
      try {
        console.log("🔌 useMetaMask: Trying to get provider state")
        await ethereum._state
        console.log("🔌 useMetaMask: Provider state available")
      } catch (err) {
        console.log("🔌 useMetaMask: Provider state check error:", err)
      }

      // Request account access with error handling
      console.log("🔌 useMetaMask: Requesting accounts")
      let accounts
      try {
        accounts = await ethereum.request({ method: "eth_requestAccounts" })
        console.log("🔌 useMetaMask: Accounts received:", accounts)
        
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned from MetaMask")
        }
      } catch (requestError: any) {
        console.error("🔌 useMetaMask: Account request error:", requestError)
        
        // Handle common errors
        if (requestError.code === 4001) {
          throw new Error("MetaMask connection rejected by user")
        } else if (requestError.code === -32002) {
          throw new Error("MetaMask connection already pending. Check your MetaMask extension.")
        } else {
          throw new Error(`MetaMask connection error: ${requestError.message || requestError}`)
        }
      }

      const userAddress = accounts[0] as string
      console.log("🔌 useMetaMask: Using address:", userAddress)

      try {
        // Create wallet client
        console.log("🔌 useMetaMask: Creating wallet client")
        const client = createWalletClient({
          transport: custom(ethereum),
          chain: polygon,
          account: userAddress as Hex,
        })
        console.log("🔌 useMetaMask: Wallet client created")

        setAddress(userAddress)
        setIsConnected(true)
        setWalletClient(client)
        
        // Update the wallet client in yellowTradingService
        console.log("🔌 useMetaMask: Setting MetaMask wallet client in service")
        setMetaMaskWalletClient(client, userAddress)
        console.log("🔌 useMetaMask: Connection completed successfully")
        
        return
      } catch (clientError) {
        console.error("🔌 useMetaMask: Error creating wallet client:", clientError)
        throw new Error(`Failed to initialize wallet client: ${clientError}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to MetaMask"
      setError(errorMessage)
      console.error("🔌 useMetaMask: Connection error:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    console.log("🔌 useMetaMask: Disconnecting")
    setAddress(null)
    setIsConnected(false)
    setWalletClient(null)
    
    // Update the wallet client in yellowTradingService
    setMetaMaskWalletClient(null, null)
    console.log("🔌 useMetaMask: Disconnected")
  }, [])

  // Listen for account changes
  useEffect(() => {
    const ethereum = getEthereum()
    if (!ethereum) return

    console.log("🔌 useMetaMask: Setting up account change listeners")

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔌 useMetaMask: Accounts changed:", accounts)
      if (accounts.length === 0) {
        // User disconnected their wallet
        console.log("🔌 useMetaMask: No accounts, disconnecting")
        disconnect()
      } else {
        // Update the address if it changed
        const newAddress = accounts[0]
        console.log("🔌 useMetaMask: New address:", newAddress)
        setAddress(newAddress)
        
        if (walletClient) {
          // Update the wallet client with the new account
          console.log("🔌 useMetaMask: Updating wallet client with new address")
          try {
            const updatedClient = createWalletClient({
              transport: custom(ethereum),
              chain: polygon,
              account: newAddress as Hex,
            })
            setWalletClient(updatedClient)
            
            // Update the wallet client in yellowTradingService
            setMetaMaskWalletClient(updatedClient, newAddress)
            console.log("🔌 useMetaMask: Wallet client updated")
          } catch (err) {
            console.error("🔌 useMetaMask: Error updating wallet client:", err)
          }
        }
      }
    }

    const handleChainChanged = () => {
      // Reload the page when the chain changes
      console.log("🔌 useMetaMask: Chain changed, reloading page")
      window.location.reload()
    }

    try {
      ethereum.on("accountsChanged", handleAccountsChanged)
      ethereum.on("chainChanged", handleChainChanged)
      
      console.log("🔌 useMetaMask: Event listeners attached")
      
      return () => {
        try {
          console.log("🔌 useMetaMask: Removing event listeners")
          ethereum.removeListener("accountsChanged", handleAccountsChanged)
          ethereum.removeListener("chainChanged", handleChainChanged)
        } catch (err) {
          console.error("🔌 useMetaMask: Error removing listeners:", err)
        }
      }
    } catch (err) {
      console.error("🔌 useMetaMask: Error setting up event listeners:", err)
      return undefined
    }
  }, [disconnect, walletClient])

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log("🔌 useMetaMask: Checking initial connection")
      const ethereum = getEthereum()
      if (!ethereum) {
        console.log("🔌 useMetaMask: No ethereum object found")
        return
      }

      try {
        console.log("🔌 useMetaMask: Requesting eth_accounts")
        const accounts = await ethereum.request({ method: "eth_accounts" })
        console.log("🔌 useMetaMask: eth_accounts result:", accounts)
        
        if (accounts.length > 0) {
          const userAddress = accounts[0] as string
          console.log("🔌 useMetaMask: Found connected account:", userAddress)
          
          try {
            const client = createWalletClient({
              transport: custom(ethereum),
              chain: polygon,
              account: userAddress as Hex,
            })
            
            setAddress(userAddress)
            setIsConnected(true)
            setWalletClient(client)
            
            // Update the wallet client in yellowTradingService
            setMetaMaskWalletClient(client, userAddress)
            console.log("🔌 useMetaMask: Initial connection established")
          } catch (clientErr) {
            console.error("🔌 useMetaMask: Error creating initial wallet client:", clientErr)
          }
        } else {
          console.log("🔌 useMetaMask: No connected accounts found")
        }
      } catch (err) {
        console.error("🔌 useMetaMask: Error checking initial connection:", err)
      }
    }

    checkConnection()
  }, [])

  return {
    address,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    walletClient,
  }
}
