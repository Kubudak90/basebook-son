import { useReadContracts } from "wagmi"
import { LBPairABI } from "@/lib/contracts/abis"
import { baseSepolia } from "wagmi/chains"
import { useMemo } from "react"

export interface PoolFees {
  baseFee: number // Base fee in %
  volatilityFee: number // Volatility surge fee in %
  totalFee: number // Total fee in %
  protocolShare: number // Protocol share in %
  isLoading: boolean
}

/**
 * Hook to get dynamic fee information from a Liquidity Book pair
 * Trader Joe v2 uses volatility-based surge pricing
 */
export function usePoolFees(pairAddress: `0x${string}` | undefined): PoolFees {
  const { data, isLoading } = useReadContracts({
    contracts: pairAddress
      ? [
          {
            address: pairAddress,
            abi: LBPairABI,
            functionName: "getStaticFeeParameters",
            chainId: baseSepolia.id,
          },
          {
            address: pairAddress,
            abi: LBPairABI,
            functionName: "getVariableFeeParameters",
            chainId: baseSepolia.id,
          },
        ]
      : [],
  })

  return useMemo(() => {
    if (!data || isLoading) {
      return {
        baseFee: 0,
        volatilityFee: 0,
        totalFee: 0,
        protocolShare: 0,
        isLoading: true,
      }
    }

    // Static fee parameters
    const staticParams = data[0]
    const baseFactor =
      staticParams?.status === "success" && staticParams.result
        ? Number(staticParams.result[0]) // baseFactor
        : 0

    const protocolShareRaw =
      staticParams?.status === "success" && staticParams.result
        ? Number(staticParams.result[5]) // protocolShare
        : 0

    // Variable fee parameters
    const variableParams = data[1]
    const volatilityAccumulator =
      variableParams?.status === "success" && variableParams.result
        ? Number(variableParams.result[0]) // volatilityAccumulator
        : 0

    // Calculate fees in percentage
    // baseFactor is in basis points (1 = 0.01%)
    const baseFee = baseFactor / 10000

    // Volatility fee calculation (simplified)
    // In Joe v2, volatility increases fee dynamically
    const volatilityFee = volatilityAccumulator / 100000

    const totalFee = baseFee + volatilityFee
    const protocolShare = protocolShareRaw / 10000

    return {
      baseFee,
      volatilityFee,
      totalFee,
      protocolShare,
      isLoading: false,
    }
  }, [data, isLoading])
}
