"use client"

import { useEffect } from "react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { useToast } from "@/hooks/use-toast"

/**
 * Hook to enforce Base Sepolia network.
 * Automatically switches user's wallet to Base Sepolia if connected to wrong network.
 */
export function useEnforceChain() {
    const { isConnected } = useAccount()
    const chainId = useChainId()
    const { switchChain, isPending, error } = useSwitchChain()
    const { toast } = useToast()

    const isWrongNetwork = isConnected && chainId !== baseSepolia.id

    useEffect(() => {
        if (isWrongNetwork && !isPending) {
            // Automatically try to switch to Base Sepolia
            toast({
                title: "Yanlış ağda bağlısınız",
                description: "Base Sepolia'ya geçiş yapılıyor...",
            })

            switchChain({ chainId: baseSepolia.id })
        }
    }, [isWrongNetwork, isPending, switchChain, toast])

    useEffect(() => {
        if (error) {
            toast({
                title: "Ağ değiştirme hatası",
                description: error.message || "Base Sepolia ağına geçilemedi. Lütfen manuel olarak değiştirin.",
                variant: "destructive",
            })
        }
    }, [error, toast])

    return {
        isWrongNetwork,
        isSwitching: isPending,
        switchToBaseSepolia: () => switchChain({ chainId: baseSepolia.id }),
    }
}
