"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useMetaMask } from "@/hooks/useMetaMask"
import { Wallet, RefreshCw } from "lucide-react"
import { isMetaMaskConnected as checkServiceConnected } from "@/services/yellowTradingService"

export default function MetaMaskConnect() {
  const { address, isConnected, isLoading, error, connect, disconnect } = useMetaMask()
  const [debugLoading, setDebugLoading] = useState(false)
  const [isMetaMaskDetected, setIsMetaMaskDetected] = useState(false)
  const [serviceConnection, setServiceConnection] = useState(false)
  
  // Safe check for MetaMask on client side only
  useEffect(() => {
    setIsMetaMaskDetected(typeof window !== 'undefined' && !!window.ethereum)
    
    // Safe check for service connection
    const checkService = () => {
      try {
        const isConnected = checkServiceConnected()
        setServiceConnection(isConnected)
      } catch (err) {
        console.error("Error checking service connection:", err)
        setServiceConnection(false)
      }
    }
    
    checkService()
    const interval = setInterval(checkService, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleConnect = async () => {
    console.log("🦊 MetaMaskConnect: Connect button clicked")
    console.log("🦊 MetaMaskConnect: window.ethereum available:", isMetaMaskDetected)
    
    try {
      // Check if MetaMask is installed
      if (!isMetaMaskDetected) {
        alert("MetaMask is not installed. Please install MetaMask extension and reload the page.")
        return
      }
      
      // Try direct account request
      setDebugLoading(true)
      console.log("🦊 MetaMaskConnect: Requesting accounts directly from window.ethereum")
      
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
          console.log("🦊 MetaMaskConnect: Direct accounts request result:", accounts)
        } else {
          console.log("🦊 MetaMaskConnect: window.ethereum not available for direct request")
        }
      } catch (err) {
        console.error("🦊 MetaMaskConnect: Direct accounts request error:", err)
      }
      
      // Try the hook's connect method
      console.log("🦊 MetaMaskConnect: Calling hook's connect method")
      await connect()
      console.log("🦊 MetaMaskConnect: Hook connect method completed")
      
      // Check if service sees the connection
      const serviceConnected = checkServiceConnected()
      console.log("🦊 MetaMaskConnect: Service sees connection:", serviceConnected)
    } catch (err) {
      console.error("🦊 MetaMaskConnect: Error in handleConnect:", err)
    } finally {
      setDebugLoading(false)
    }
  }

  const isButtonLoading = isLoading || debugLoading

  return (
    <div className="flex flex-col gap-2">
      {!isConnected ? (
        <div>
          <Button
            onClick={handleConnect}
            disabled={isButtonLoading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Wallet className="h-4 w-4" />
            {isButtonLoading ? "Connecting..." : "Connect MetaMask"}
          </Button>
          <div className="text-xs mt-1 text-gray-500">
            {isMetaMaskDetected ? "MetaMask detected" : "MetaMask not detected"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Connected: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
            <Button
              variant="outline"
              onClick={disconnect}
              size="sm"
              className="text-xs h-8 border-gray-300"
            >
              Disconnect
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Service sees connection: {serviceConnection ? "Yes" : "No"}
          </div>
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
