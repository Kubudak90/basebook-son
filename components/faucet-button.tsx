"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Droplets, Loader2, Check, Clock } from "lucide-react"
import { TOKENS } from "@/lib/contracts/addresses"
import { MemeCoinABI } from "@/lib/contracts/abis"
import { useToast } from "@/hooks/use-toast"

// Faucet-enabled tokens
const FAUCET_TOKENS = [
    { ...TOKENS.PEPE, key: "PEPE" },
    { ...TOKENS.BRETT, key: "BRETT" },
]

export function FaucetButton() {
    const { address, isConnected } = useAccount()
    const { toast } = useToast()
    const [mounted, setMounted] = useState(false)
    const [selectedToken, setSelectedToken] = useState<typeof FAUCET_TOKENS[0] | null>(null)
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Read if can claim for selected token
    const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
        address: selectedToken?.address as `0x${string}`,
        abi: MemeCoinABI,
        functionName: "canClaimFaucet",
        args: address ? [address] : undefined,
        query: {
            enabled: !!selectedToken && !!address,
        },
    })

    // Read time until next claim
    const { data: timeUntilClaim, refetch: refetchTime } = useReadContract({
        address: selectedToken?.address as `0x${string}`,
        abi: MemeCoinABI,
        functionName: "timeUntilNextClaim",
        args: address ? [address] : undefined,
        query: {
            enabled: !!selectedToken && !!address,
        },
    })

    const { writeContractAsync, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    useEffect(() => {
        if (isSuccess) {
            toast({
                title: "🎉 Tokens Claimed!",
                description: `You received 1000 ${selectedToken?.symbol}!`,
            })
            refetchCanClaim()
            refetchTime()
            setTxHash(undefined)
        }
    }, [isSuccess, selectedToken, toast, refetchCanClaim, refetchTime])

    const handleClaim = async (token: typeof FAUCET_TOKENS[0]) => {
        if (!address) return

        try {
            setSelectedToken(token)
            const hash = await writeContractAsync({
                address: token.address as `0x${string}`,
                abi: MemeCoinABI,
                functionName: "faucet",
            })
            setTxHash(hash)
            toast({
                title: "Transaction Submitted",
                description: `Claiming ${token.symbol}...`,
            })
        } catch (error: any) {
            toast({
                title: "Claim Failed",
                description: error.message?.includes("Please wait")
                    ? "Please wait 24 hours between claims"
                    : error.message,
                variant: "destructive",
            })
        }
    }

    // Don't render until mounted (prevents hydration mismatch)
    if (!mounted || !isConnected) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Faucet
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Claim Free Tokens
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {FAUCET_TOKENS.map((token) => (
                    <FaucetTokenItem
                        key={token.key}
                        token={token}
                        address={address}
                        onClaim={handleClaim}
                        isLoading={isPending || isConfirming}
                        selectedToken={selectedToken}
                    />
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    24 hour cooldown between claims
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function FaucetTokenItem({
    token,
    address,
    onClaim,
    isLoading,
    selectedToken,
}: {
    token: typeof FAUCET_TOKENS[0]
    address: `0x${string}` | undefined
    onClaim: (token: typeof FAUCET_TOKENS[0]) => void
    isLoading: boolean
    selectedToken: typeof FAUCET_TOKENS[0] | null
}) {
    const { data: canClaim } = useReadContract({
        address: token.address as `0x${string}`,
        abi: MemeCoinABI,
        functionName: "canClaimFaucet",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    const { data: timeUntilClaim } = useReadContract({
        address: token.address as `0x${string}`,
        abi: MemeCoinABI,
        functionName: "timeUntilNextClaim",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    })

    const isThisLoading = isLoading && selectedToken?.key === token.key
    const timeLeft = timeUntilClaim ? Number(timeUntilClaim) : 0

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return null
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${mins}m`
    }

    return (
        <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer"
            onClick={() => canClaim && onClaim(token)}
            disabled={!canClaim || isLoading}
        >
            <div className="flex items-center gap-2">
                <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/20"
                    }}
                />
                <span className="font-medium">{token.symbol}</span>
                <span className="text-xs text-muted-foreground">1000</span>
            </div>
            <div>
                {isThisLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : canClaim ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>
        </DropdownMenuItem>
    )
}
