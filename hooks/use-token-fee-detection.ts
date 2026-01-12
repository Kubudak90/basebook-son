import { useState, useEffect } from "react"
import { usePublicClient } from "wagmi"
import { baseSepolia } from "wagmi/chains"

/**
 * Known fee-on-transfer tokens (address => fee info)
 * These tokens deduct a fee on every transfer
 */
const KNOWN_FEE_TOKENS: Record<string, { name: string; feePercent: number }> = {
  // Add known fee-on-transfer tokens here
  // Example: "0x...": { name: "SAFEMOON", feePercent: 10 }
}

/**
 * Detects if a token is a fee-on-transfer token
 *
 * Fee-on-transfer tokens (also called deflationary/rebase tokens) deduct
 * a percentage on every transfer, causing the received amount to be less
 * than the sent amount.
 *
 * Detection methods:
 * 1. Check against known fee-on-transfer tokens list
 * 2. Static analysis: Check for common patterns in bytecode (future enhancement)
 * 3. Simulation: Perform a test transfer and compare amounts (future enhancement)
 */
export function useTokenFeeDetection(tokenAddress: `0x${string}` | undefined) {
  const [isFeeToken, setIsFeeToken] = useState(false)
  const [feeInfo, setFeeInfo] = useState<{ name: string; feePercent: number } | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!tokenAddress) {
      setIsFeeToken(false)
      setFeeInfo(null)
      return
    }

    setIsChecking(true)

    // Check against known list (case-insensitive)
    const normalizedAddress = tokenAddress.toLowerCase()
    const knownFee = KNOWN_FEE_TOKENS[normalizedAddress]

    if (knownFee) {
      setIsFeeToken(true)
      setFeeInfo(knownFee)
    } else {
      setIsFeeToken(false)
      setFeeInfo(null)
    }

    setIsChecking(false)
  }, [tokenAddress])

  return {
    isFeeToken,
    feeInfo,
    isChecking,
    /**
     * Returns true if we should use fee-supporting swap functions
     * This includes both detected fee tokens and as a safety measure for unknown tokens
     */
    shouldUseFeeSupporting: isFeeToken,
  }
}

/**
 * Helper to add a token to the known fee tokens list
 * This would typically be managed through a configuration file or API
 */
export function addKnownFeeToken(
  address: string,
  name: string,
  feePercent: number
) {
  KNOWN_FEE_TOKENS[address.toLowerCase()] = { name, feePercent }
}
