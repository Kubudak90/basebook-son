import { useAccount, useReadContracts } from "wagmi"
import { useMemo } from "react"
import { LBPairABI } from "@/lib/contracts/abis"
import { baseSepolia } from "wagmi/chains"

export interface UserLiquidityPosition {
  binId: number
  balance: bigint
  amountX: bigint
  amountY: bigint
  binReserveX: bigint
  binReserveY: bigint
  price: number
}

/**
 * Optimized user liquidity hook with reduced contract calls
 *
 * Optimization strategy:
 * - Reduced range from ±50 to ±20 bins (101 → 41 bins, ~60% reduction)
 * - Only fetch bin reserves & totalSupply for bins with user balance
 * - Batch all contract calls for parallel execution
 *
 * Gas savings: ~60 fewer contract calls per query
 * Old: 101 balanceOf + ~10 getBin + ~10 totalSupply = ~121 calls
 * New: 41 balanceOf + ~5 getBin + ~5 totalSupply = ~51 calls
 */
export function useOptimizedUserLiquidity(poolPairAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  // Get active ID and binStep
  const { data: poolInfoData } = useReadContracts({
    contracts: poolPairAddress
      ? [
          {
            address: poolPairAddress,
            abi: LBPairABI,
            functionName: "getActiveId",
            chainId: baseSepolia.id,
          },
          {
            address: poolPairAddress,
            abi: LBPairABI,
            functionName: "getBinStep",
            chainId: baseSepolia.id,
          },
        ]
      : [],
  })

  const activeId = poolInfoData?.[0]?.status === "success"
    ? Number(poolInfoData[0].result)
    : undefined

  const binStep = poolInfoData?.[1]?.status === "success"
    ? Number(poolInfoData[1].result)
    : 25

  // Generate bin IDs to check - OPTIMIZED: ±20 instead of ±50
  // Most users have positions within ±20 bins of active price
  const binIdsToCheck = useMemo(() => {
    if (!activeId) return []
    const range = 20 // Reduced from 50 (60% fewer calls)
    const ids: number[] = []
    for (let i = -range; i <= range; i++) {
      ids.push(activeId + i)
    }
    return ids
  }, [activeId])

  // Batch fetch balances for all bin IDs
  const balanceContracts = useMemo(() => {
    if (!poolPairAddress || !address || binIdsToCheck.length === 0) return []

    return binIdsToCheck.map((binId) => ({
      address: poolPairAddress,
      abi: LBPairABI,
      functionName: "balanceOf" as const,
      args: [address, BigInt(binId)],
      chainId: baseSepolia.id,
    }))
  }, [poolPairAddress, address, binIdsToCheck])

  const { data: balanceData, isLoading: isLoadingBalances } = useReadContracts({
    contracts: balanceContracts,
  })

  // Batch fetch bin reserves for bins with non-zero balance
  const binReserveContracts = useMemo(() => {
    if (!poolPairAddress || !balanceData) return []

    const binsWithBalance = binIdsToCheck.filter((binId, index) => {
      const balance = balanceData[index]
      return balance?.status === "success" && balance.result && balance.result > BigInt(0)
    })

    return binsWithBalance.map((binId) => ({
      address: poolPairAddress,
      abi: LBPairABI,
      functionName: "getBin" as const,
      args: [binId],
      chainId: baseSepolia.id,
    }))
  }, [poolPairAddress, balanceData, binIdsToCheck])

  const { data: binReserveData, isLoading: isLoadingReserves } = useReadContracts({
    contracts: binReserveContracts,
  })

  // Batch fetch total supply for bins with non-zero balance
  const totalSupplyContracts = useMemo(() => {
    if (!poolPairAddress || !balanceData) return []

    const binsWithBalance = binIdsToCheck.filter((binId, index) => {
      const balance = balanceData[index]
      return balance?.status === "success" && balance.result && balance.result > BigInt(0)
    })

    return binsWithBalance.map((binId) => ({
      address: poolPairAddress,
      abi: LBPairABI,
      functionName: "totalSupply" as const,
      args: [BigInt(binId)],
      chainId: baseSepolia.id,
    }))
  }, [poolPairAddress, balanceData, binIdsToCheck])

  const { data: totalSupplyData, isLoading: isLoadingTotalSupply } = useReadContracts({
    contracts: totalSupplyContracts,
  })

  // Combine all data into positions
  const positions = useMemo(() => {
    if (!balanceData || !activeId) return []

    const result: UserLiquidityPosition[] = []
    let dataIndex = 0

    binIdsToCheck.forEach((binId, index) => {
      const balanceResult = balanceData[index]

      if (balanceResult?.status === "success" && balanceResult.result && balanceResult.result > BigInt(0)) {
        const balance = balanceResult.result

        // Get bin reserves
        const reserveResult = binReserveData?.[dataIndex]
        let binReserveX = BigInt(0)
        let binReserveY = BigInt(0)

        if (reserveResult?.status === "success" && Array.isArray(reserveResult.result)) {
          binReserveX = BigInt(reserveResult.result[0])
          binReserveY = BigInt(reserveResult.result[1])
        }

        // Get total supply for this bin
        const totalSupplyResult = totalSupplyData?.[dataIndex]
        let totalSupply = BigInt(0)

        if (totalSupplyResult?.status === "success" && totalSupplyResult.result) {
          totalSupply = BigInt(totalSupplyResult.result)
        }

        // Calculate user's actual share of reserves
        let amountX = BigInt(0)
        let amountY = BigInt(0)

        if (totalSupply > BigInt(0)) {
          amountX = (balance * binReserveX) / totalSupply
          amountY = (balance * binReserveY) / totalSupply
        }

        // Calculate price from bin ID
        const priceBase = 1 + binStep / 10000
        const pricePower = binId - 8388608 // 2^23
        const price = Math.pow(priceBase, pricePower)

        result.push({
          binId,
          balance,
          amountX,
          amountY,
          binReserveX,
          binReserveY,
          price,
        })

        dataIndex++
      }
    })

    return result.sort((a, b) => a.binId - b.binId)
  }, [balanceData, binReserveData, totalSupplyData, binIdsToCheck, activeId, binStep])

  return {
    positions,
    activeId,
    binStep,
    isLoading: isLoadingBalances || isLoadingReserves || isLoadingTotalSupply,
  }
}
