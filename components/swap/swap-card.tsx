"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TokenSelect } from "./token-select"
import { ArrowDown, Settings } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { CONTRACTS, TOKENS } from "@/lib/contracts/addresses"
import { LBRouterABI, ERC20ABI, LBQuoterABI } from "@/lib/contracts/abis"
import { useTokenBalance } from "@/lib/hooks/use-token-balance"
import { useTokenAllowance } from "@/lib/hooks/use-token-allowance"
import { parseUnits, formatUnits } from "viem"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { baseSepolia } from "wagmi/chains"
import { useTransactionHistory } from "@/hooks/use-transaction-history"
import { usePoolFees } from "@/hooks/use-pool-fees"
import { useTokenFeeDetection } from "@/hooks/use-token-fee-detection"

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
}

export function SwapCard() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const { writeContractAsync } = useWriteContract()
  const { addTransaction, updateTransaction } = useTransactionHistory()

  const [fromToken, setFromToken] = useState<Token | null>(TOKENS.WETH)
  const [toToken, setToToken] = useState<Token | null>(TOKENS.USDC)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [swapMode, setSwapMode] = useState<"exactIn" | "exactOut">("exactIn")
  const [isQuoting, setIsQuoting] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  const { formattedBalance: fromBalance } = useTokenBalance(fromToken?.address as `0x${string}`)
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    fromToken?.address as `0x${string}`,
    CONTRACTS.LBRouter as `0x${string}`,
  )

  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>()
  const [swapTxHash, setSwapTxHash] = useState<`0x${string}` | undefined>()

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })

  const { isLoading: isSwapping, isSuccess: isSwapSuccess, isError: isSwapError } = useWaitForTransactionReceipt({
    hash: swapTxHash,
  })

  // Track swap transaction status
  useEffect(() => {
    if (!swapTxHash) return

    if (isSwapSuccess) {
      updateTransaction(swapTxHash, { status: "success" })
      toast({
        title: "Swap successful",
        description: "Your tokens have been swapped",
      })
    } else if (isSwapError) {
      updateTransaction(swapTxHash, { status: "failed", errorMessage: "Transaction failed" })
    }
  }, [swapTxHash, isSwapSuccess, isSwapError, updateTransaction, toast])

  // Prepare quote parameters based on swap mode
  const quoteParamsExactIn = useMemo(() => {
    if (swapMode !== "exactIn" || !fromToken || !toToken || !fromAmount || Number(fromAmount) <= 0) {
      return null
    }

    try {
      const amountIn = parseUnits(fromAmount, fromToken.decimals)
      const route = [fromToken.address, toToken.address]
      return { amountIn, route }
    } catch {
      return null
    }
  }, [swapMode, fromToken, toToken, fromAmount])

  const quoteParamsExactOut = useMemo(() => {
    if (swapMode !== "exactOut" || !fromToken || !toToken || !toAmount || Number(toAmount) <= 0) {
      return null
    }

    try {
      const amountOut = parseUnits(toAmount, toToken.decimals)
      const route = [fromToken.address, toToken.address]
      return { amountOut, route }
    } catch {
      return null
    }
  }, [swapMode, fromToken, toToken, toAmount])

  // Get swap quote from LBQuoter - Exact Input
  const { data: quoteDataExactIn, isLoading: isLoadingQuoteExactIn } = useReadContract({
    address: CONTRACTS.LBQuoter as `0x${string}`,
    abi: LBQuoterABI,
    functionName: "findBestPathFromAmountIn",
    args: quoteParamsExactIn ? [quoteParamsExactIn.route as `0x${string}`[], quoteParamsExactIn.amountIn] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!quoteParamsExactIn && swapMode === "exactIn",
      refetchInterval: 10000,
    },
  })

  // Get swap quote from LBQuoter - Exact Output
  const { data: quoteDataExactOut, isLoading: isLoadingQuoteExactOut } = useReadContract({
    address: CONTRACTS.LBQuoter as `0x${string}`,
    abi: LBQuoterABI,
    functionName: "findBestPathFromAmountOut",
    args: quoteParamsExactOut ? [quoteParamsExactOut.route as `0x${string}`[], quoteParamsExactOut.amountOut] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!quoteParamsExactOut && swapMode === "exactOut",
      refetchInterval: 10000,
    },
  })

  // Select active quote based on mode
  const quoteData = swapMode === "exactIn" ? quoteDataExactIn : quoteDataExactOut
  const isLoadingQuote = swapMode === "exactIn" ? isLoadingQuoteExactIn : isLoadingQuoteExactOut

  // Calculate output/input amount from quote
  const calculatedOutput = useMemo(() => {
    if (swapMode === "exactIn") {
      // For exact input, calculate output
      if (!quoteDataExactIn || !toToken) return null

      try {
        const amounts = (quoteDataExactIn as any).amounts
        if (!amounts || amounts.length === 0) return null
        const outputAmount = amounts[amounts.length - 1]
        return formatUnits(outputAmount, toToken.decimals)
      } catch {
        return null
      }
    } else {
      // For exact output, return the user's input (already known)
      return toAmount || null
    }
  }, [swapMode, quoteDataExactIn, toToken, toAmount])

  const calculatedInput = useMemo(() => {
    if (swapMode === "exactOut") {
      // For exact output, calculate required input
      if (!quoteDataExactOut || !fromToken) return null

      try {
        const amounts = (quoteDataExactOut as any).amounts
        if (!amounts || amounts.length === 0) return null
        const inputAmount = amounts[0]
        return formatUnits(inputAmount, fromToken.decimals)
      } catch {
        return null
      }
    } else {
      // For exact input, return the user's input (already known)
      return fromAmount || null
    }
  }, [swapMode, quoteDataExactOut, fromToken, fromAmount])

  // Calculate price impact
  const priceImpact = useMemo(() => {
    if (!quoteData || !toToken) return null

    try {
      const amounts = (quoteData as any).amounts
      const virtualAmounts = (quoteData as any).virtualAmountsWithoutSlippage

      if (!amounts || !virtualAmounts || amounts.length === 0 || virtualAmounts.length === 0) {
        return null
      }

      // Get the last amounts (output amounts)
      const actualAmount = amounts[amounts.length - 1]
      const virtualAmount = virtualAmounts[virtualAmounts.length - 1]

      if (!actualAmount || !virtualAmount || virtualAmount === BigInt(0)) {
        return null
      }

      // Calculate price impact: (1 - actualAmount / virtualAmount) × 100
      const actualNum = Number(formatUnits(actualAmount, toToken.decimals))
      const virtualNum = Number(formatUnits(virtualAmount, toToken.decimals))

      const impact = ((virtualNum - actualNum) / virtualNum) * 100
      return impact
    } catch {
      return null
    }
  }, [quoteData, toToken])

  // Get price impact color and severity
  const getPriceImpactColor = (impact: number | null) => {
    if (impact === null) return { color: "text-muted-foreground", bg: "bg-muted" }
    if (impact < 1) return { color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" }
    if (impact < 3) return { color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" }
    if (impact < 5) return { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" }
    return { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" }
  }

  const getPriceImpactWarning = (impact: number | null) => {
    if (impact === null) return null
    if (impact >= 5) return "High price impact! Your trade will significantly move the market price."
    if (impact >= 3) return "Moderate price impact. Consider splitting into smaller trades."
    if (impact >= 1) return "Low price impact."
    return null
  }

  // Get pair address from quote for fee information
  const pairAddress = useMemo(() => {
    if (!quoteData) return undefined
    try {
      const pairs = (quoteData as any).pairs
      if (!pairs || pairs.length === 0) return undefined
      return pairs[0] as `0x${string}`
    } catch {
      return undefined
    }
  }, [quoteData])

  // Get dynamic fees from the pool
  const { baseFee, volatilityFee, totalFee, isLoading: isLoadingFees } = usePoolFees(pairAddress)

  // Detect fee-on-transfer tokens
  const { isFeeToken: isFromFeeToken, feeInfo: fromFeeInfo } = useTokenFeeDetection(
    fromToken?.address as `0x${string}`
  )
  const { isFeeToken: isToFeeToken, feeInfo: toFeeInfo } = useTokenFeeDetection(
    toToken?.address as `0x${string}`
  )

  // If either token is fee-on-transfer, we should use supporting functions
  const shouldUseFeeSupporting = isFromFeeToken || isToFeeToken

  // Validate input amount
  const validateAmount = (amount: string): string | null => {
    if (!amount || amount.trim() === "") {
      return null // Empty is ok, just disable button
    }

    const num = Number.parseFloat(amount)

    if (isNaN(num)) {
      return "Please enter a valid number"
    }

    if (num <= 0) {
      return "Amount must be greater than 0"
    }

    if (num < 0) {
      return "Amount cannot be negative"
    }

    // Check against balance
    if (fromToken && fromBalance) {
      const balance = Number.parseFloat(fromBalance)
      if (num > balance) {
        return `Insufficient balance. You have ${fromBalance} ${fromToken.symbol}`
      }
    }

    return null
  }

  // Validate slippage
  const validateSlippage = (slip: string): string | null => {
    const num = Number.parseFloat(slip)

    if (isNaN(num)) {
      return "Invalid slippage"
    }

    if (num < 0.01) {
      return "Slippage too low (min 0.01%)"
    }

    if (num > 50) {
      return "Slippage too high (max 50%)"
    }

    return null
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (swapMode === "exactIn") {
      const error = validateAmount(value)
      setInputError(error)
    }
  }

  const handleToAmountChange = (value: string) => {
    setToAmount(value)
    if (swapMode === "exactOut") {
      const error = validateAmount(value)
      setInputError(error)
    }
  }

  const toggleSwapMode = () => {
    setSwapMode(prev => prev === "exactIn" ? "exactOut" : "exactIn")
    // Clear amounts when switching modes
    setFromAmount("")
    setToAmount("")
    setInputError(null)
  }

  const handleSlippageChange = (value: string) => {
    setSlippage(value)
    const error = validateSlippage(value)
    if (error) {
      toast({
        title: "Invalid slippage",
        description: error,
        variant: "destructive",
      })
    }
  }

  const handleSwap = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    // Clear amounts when swapping to trigger new quote
    setFromAmount("")
    setToAmount("")
    setInputError(null)
  }

  // Check if token is native ETH (WETH on this chain)
  const isNativeToken = (token: Token | null) => {
    if (!token) return false
    return token.address.toLowerCase() === CONTRACTS.WETH.toLowerCase()
  }

  const needsApproval = () => {
    const inputAmount = swapMode === "exactIn" ? fromAmount : calculatedInput
    if (!inputAmount || !fromToken) return false
    // Native ETH doesn't need approval
    if (isNativeToken(fromToken)) return false
    try {
      const amount = parseUnits(inputAmount, fromToken.decimals)
      return (allowance as bigint) < amount
    } catch {
      return false
    }
  }

  const handleApprove = async () => {
    const inputAmount = swapMode === "exactIn" ? fromAmount : calculatedInput
    if (!fromToken || !inputAmount) return

    try {
      const amount = parseUnits(inputAmount, fromToken.decimals)
      const hash = await writeContractAsync({
        address: fromToken.address as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [CONTRACTS.LBRouter, amount],
      })

      setApproveTxHash(hash)
      toast({
        title: "Approval submitted",
        description: "Waiting for confirmation...",
      })

      await refetchAllowance()
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSwapTokens = async () => {
    if (!fromToken || !toToken || !address || !quoteData) return

    // For exact input mode, need fromAmount and calculatedOutput
    // For exact output mode, need toAmount and calculatedInput
    if (swapMode === "exactIn" && (!fromAmount || !calculatedOutput)) return
    if (swapMode === "exactOut" && (!toAmount || !calculatedInput)) return

    try {
      const binSteps = (quoteData as any).binSteps || [25]
      const tokenPath = [fromToken.address as `0x${string}`, toToken.address as `0x${string}`]
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      const fromIsNative = isNativeToken(fromToken)
      const toIsNative = isNativeToken(toToken)

      let hash: `0x${string}`

      if (swapMode === "exactIn") {
        // EXACT INPUT MODE
        const amountIn = parseUnits(fromAmount!, fromToken.decimals)
        const expectedOut = parseUnits(calculatedOutput!, toToken.decimals)
        const slippageBps = BigInt(Math.floor(Number.parseFloat(slippage) * 100))
        const minAmountOut = (expectedOut * (BigInt(10000) - slippageBps)) / BigInt(10000)

        // Use fee-on-transfer supporting functions if needed
        if (shouldUseFeeSupporting) {
          // Fee-on-transfer tokens require special handling
          // These functions don't return amounts, they just succeed or revert
          if (fromIsNative) {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactNATIVEForTokensSupportingFeeOnTransferTokens",
              value: amountIn,
              args: [minAmountOut, binSteps, tokenPath, address, deadline],
            })
          } else if (toIsNative) {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactTokensForNATIVESupportingFeeOnTransferTokens",
              args: [amountIn, minAmountOut, binSteps, tokenPath, address, deadline],
            })
          } else {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
              args: [amountIn, minAmountOut, binSteps, tokenPath, address, deadline],
            })
          }
        } else {
          // Regular swaps (no fee-on-transfer)
          if (fromIsNative) {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactNATIVEForTokens",
              value: amountIn,
              args: [minAmountOut, binSteps, tokenPath, address, deadline],
            })
          } else if (toIsNative) {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactTokensForNATIVE",
              args: [amountIn, minAmountOut, binSteps, tokenPath, address, deadline],
            })
          } else {
            hash = await writeContractAsync({
              address: CONTRACTS.LBRouter as `0x${string}`,
              abi: LBRouterABI,
              functionName: "swapExactTokensForTokens",
              args: [amountIn, minAmountOut, binSteps, tokenPath, address, deadline],
            })
          }
        }
      } else {
        // EXACT OUTPUT MODE
        // Warning: Exact output doesn't work with fee-on-transfer tokens
        if (shouldUseFeeSupporting) {
          toast({
            title: "Fee-on-transfer token detected",
            description: "Exact output mode is not supported for fee-on-transfer tokens. Please use exact input mode.",
            variant: "destructive",
          })
          return
        }

        const amountOut = parseUnits(toAmount!, toToken.decimals)
        const expectedIn = parseUnits(calculatedInput!, fromToken.decimals)
        const slippageBps = BigInt(Math.floor(Number.parseFloat(slippage) * 100))
        const maxAmountIn = (expectedIn * (BigInt(10000) + slippageBps)) / BigInt(10000)

        if (fromIsNative) {
          hash = await writeContractAsync({
            address: CONTRACTS.LBRouter as `0x${string}`,
            abi: LBRouterABI,
            functionName: "swapNATIVEForExactTokens",
            value: maxAmountIn,
            args: [amountOut, binSteps, tokenPath, address, deadline],
          })
        } else if (toIsNative) {
          hash = await writeContractAsync({
            address: CONTRACTS.LBRouter as `0x${string}`,
            abi: LBRouterABI,
            functionName: "swapTokensForExactNATIVE",
            args: [amountOut, maxAmountIn, binSteps, tokenPath, address, deadline],
          })
        } else {
          hash = await writeContractAsync({
            address: CONTRACTS.LBRouter as `0x${string}`,
            abi: LBRouterABI,
            functionName: "swapTokensForExactTokens",
            args: [amountOut, maxAmountIn, binSteps, tokenPath, address, deadline],
          })
        }
      }

      setSwapTxHash(hash)

      // Add to transaction history with correct amounts
      const actualFromAmount = swapMode === "exactIn" ? fromAmount! : calculatedInput!
      const actualToAmount = swapMode === "exactIn" ? calculatedOutput! : toAmount!

      addTransaction({
        type: "swap",
        status: "pending",
        hash,
        fromToken: {
          symbol: fromToken.symbol,
          amount: actualFromAmount,
        },
        toToken: {
          symbol: toToken.symbol,
          amount: actualToAmount,
        },
      })

      toast({
        title: "Swap submitted",
        description: "Waiting for confirmation...",
      })

      // Clear amounts
      setFromAmount("")
      setToAmount("")
    } catch (error: any) {
      toast({
        title: "Swap failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSwapMode}
              className="text-xs"
            >
              {swapMode === "exactIn" ? "Exact In" : "Exact Out"}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {swapMode === "exactIn" ? "You pay" : "You pay (max)"}
            </span>
            <span className="text-muted-foreground">Balance: {fromBalance}</span>
          </div>
          <div className="flex gap-2">
            {swapMode === "exactIn" ? (
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className={`flex-1 ${inputError ? "border-red-500" : ""}`}
                min="0"
                step="any"
              />
            ) : (
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={calculatedInput || ""}
                  disabled
                  className="flex-1 pr-8"
                />
                {isLoadingQuote && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Spinner className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}
            <TokenSelect selectedToken={fromToken} onSelectToken={setFromToken} excludeToken={toToken} />
          </div>
          {inputError && (
            <p className="text-xs text-red-500">{inputError}</p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {swapMode === "exactOut" ? "You receive (exact)" : "You receive"}
            </span>
            <span className="text-muted-foreground">
              {isLoadingQuote ? "Calculating..." : swapMode === "exactOut" ? "Exact" : "Estimated"}
            </span>
          </div>
          <div className="flex gap-2">
            {swapMode === "exactOut" ? (
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                className={`flex-1 ${inputError ? "border-red-500" : ""}`}
                min="0"
                step="any"
              />
            ) : (
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={calculatedOutput || ""}
                  disabled
                  className="flex-1 pr-8"
                />
                {isLoadingQuote && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Spinner className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}
            <TokenSelect selectedToken={toToken} onSelectToken={setToToken} excludeToken={fromToken} />
          </div>
        </div>

        {/* Swap Details */}
        {((swapMode === "exactIn" && fromAmount && calculatedOutput) ||
          (swapMode === "exactOut" && toAmount && calculatedInput)) && (
          <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {fromToken?.symbol} ≈{" "}
                {swapMode === "exactIn"
                  ? (Number.parseFloat(calculatedOutput!) / Number.parseFloat(fromAmount!)).toFixed(6)
                  : (Number.parseFloat(toAmount!) / Number.parseFloat(calculatedInput!)).toFixed(6)
                }{" "}
                {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span>{slippage}%</span>
            </div>
            {!isLoadingFees && totalFee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trading Fee</span>
                <div className="flex items-center gap-1">
                  <span>{totalFee.toFixed(3)}%</span>
                  {volatilityFee > 0 && (
                    <span className="text-xs text-orange-500" title={`Base: ${baseFee.toFixed(3)}% + Surge: ${volatilityFee.toFixed(3)}%`}>
                      ⚡
                    </span>
                  )}
                </div>
              </div>
            )}
            {shouldUseFeeSupporting && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Token Type</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-600 dark:text-amber-400">Fee-on-Transfer</span>
                  <span className="text-xs" title="This token charges a fee on transfers. Using special swap function.">
                    ⚠️
                  </span>
                </div>
              </div>
            )}
            {priceImpact !== null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-semibold ${getPriceImpactColor(priceImpact).color}`}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            {swapMode === "exactIn" ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Received</span>
                <span>
                  {(Number.parseFloat(calculatedOutput!) * (1 - Number.parseFloat(slippage) / 100)).toFixed(6)}{" "}
                  {toToken?.symbol}
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Input</span>
                <span>
                  {(Number.parseFloat(calculatedInput!) * (1 + Number.parseFloat(slippage) / 100)).toFixed(6)}{" "}
                  {fromToken?.symbol}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price Impact Warning */}
        {priceImpact !== null && priceImpact >= 1 && (
          <div className={`p-3 rounded-lg text-sm ${getPriceImpactColor(priceImpact).bg}`}>
            <div className="flex items-start gap-2">
              <span className={`font-semibold ${getPriceImpactColor(priceImpact).color}`}>
                ⚠️
              </span>
              <p className={getPriceImpactColor(priceImpact).color}>
                {getPriceImpactWarning(priceImpact)}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <Button className="w-full" disabled>
            Connect Wallet
          </Button>
        ) : needsApproval() ? (
          <Button className="w-full" onClick={handleApprove} disabled={isApproving}>
            {isApproving ? (
              <>
                <Spinner className="mr-2" />
                Approving...
              </>
            ) : (
              `Approve ${fromToken?.symbol}`
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleSwapTokens}
            disabled={
              swapMode === "exactIn"
                ? !fromAmount || !calculatedOutput || isSwapping || isLoadingQuote || !!inputError
                : !toAmount || !calculatedInput || isSwapping || isLoadingQuote || !!inputError
            }
          >
            {isSwapping ? (
              <>
                <Spinner className="mr-2" />
                Swapping...
              </>
            ) : isLoadingQuote ? (
              <>
                <Spinner className="mr-2" />
                Getting Quote...
              </>
            ) : inputError ? (
              "Invalid Input"
            ) : (
              "Swap"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
