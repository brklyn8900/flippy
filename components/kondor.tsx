
'use client';

import { Button } from "@/components/ui/button"
import * as kondor from "kondor-js"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut } from "lucide-react"

interface WalletButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function KondorButton({ variant = "default", size = "default" }: WalletButtonProps) {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)

  useEffect(() => {
    const savedWallet = localStorage.getItem('walletAddress')
    if (savedWallet) {
      setConnectedWallet(savedWallet)
    }
  }, [])

  const connectWallet = async () => {
    setIsConnecting(true)
    
    try {
      const accounts = await kondor.getAccounts()
      if (accounts && accounts.length > 0) {
        localStorage.setItem('walletAddress', accounts[0].address)
        setConnectedWallet(accounts[0].address)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    localStorage.removeItem('walletAddress')
    setConnectedWallet(null)
    router.push('/')
  }

  if (connectedWallet) {
    return (
      <Button 
        variant={variant} 
        size={size}
        onClick={disconnectWallet}
        className="font-mono"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
      </Button>
    )
  }

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={connectWallet}
      disabled={isConnecting}
    >
      {isConnecting ? "Connecting..." : "Connect Kondor"}
    </Button>
  )
}
