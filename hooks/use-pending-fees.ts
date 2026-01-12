import { useReadContracts } from "wagmi"
import { useMemo } from "react"
import { LBPairABI } from "@/lib/contracts/abis"
import { baseSepolia } from "wagmi/chains"
import { formatUnits } from "viem"

/**
 * Hook to track pending fees for a liquidity position
 *
 * How it works:
 * - Calculates user's share of the pool
 * - Estimates accumulated fees based on bin reserves growth
 * - Shows potential earnings before withdrawal
 */
export function usePendingFees(
  pairAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined,
  binId: number | undefined,
  initialBalanceX: bigint | undefined,
  initialBalanceY: bigint | undefined
) {
  // Get current bin data
  const { data: binData } = useReadContracts({
    contracts: pairAddress && binId !== undefined
      ? [
          {
            address: pairAddress,
            abi: LBPairABI,
            functionName: "getBin",
            args: [binId],
            chainId: baseSepolia.id,
          },
          {
            address: pairAddress,
            abi: LBPairABI,
            functionName: "totalSupply",
            args: [BigInt(binId)],
            chainId: baseSepolia.id,
          },
          {
            address: pairAddress,
            abi: LBPairABI,
            functionName: "balanceOf",
            args: [userAddress!, BigInt(binId)],
            chainId: baseSepolia.id,
          },
        ]
      : [],
  })

  const pendingFees = useMemo(() => {
    if (!binData || !initialBalanceX || !initialBalanceY) {
      return { feeX: "0", feeY: "0", totalValueUSD: "0" }
    }

    const binReserveData = binData[0]
    const totalSupplyData = binData[1]
    const userBalanceData = binData[2]

    if (
      binReserveData?.status !== "success" ||
      totalSupplyData?.status !== "success" ||
      userBalanceData?.status !== "success"
    ) {
      return { feeX: "0", feeY: "0", totalValueUSD: "0" }
    }

    const [currentReserveX, currentReserveY] = binReserveData.result as [bigint, bigint]
    const totalSupply = totalSupplyData.result as bigint
    const userBalance = userBalanceData.result as bigint

    if (totalSupply === BigInt(0)) {
      return { feeX: "0", feeY: "0", totalValueUSD: "0" }
    }

    // Calculate current user share
    const currentUserX = (userBalance * currentReserveX) / totalSupply
    const currentUserY = (userBalance * currentReserveY) / totalSupply

    // Fee = Current share - Initial deposit
    // (Assuming reserves only grow from fees, no IL for simplicity)
    const feeX = currentUserX > initialBalanceX ? currentUserX - initialBalanceX : BigInt(0)
    const feeY = currentUserY > initialBalanceY ? currentUserY - initialBalanceY : BigInt(0)

    return {
      feeX: formatUnits(feeX, 18), // Adjust decimals as needed
      feeY: formatUnits(feeY, 18),
      totalValueUSD: "0", // Would need price oracle
    }
  }, [binData, initialBalanceX, initialBalanceY])

  return pendingFees
}
