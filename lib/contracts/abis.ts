// Trader Joe v2 Liquidity Book ABIs
import { parseAbi } from "viem"

export const LBRouterABI = parseAbi([
  // Regular swaps
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external returns (uint256 amountOut)",
  "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external returns (uint256[] amountsIn)",

  // Native ETH swaps
  "function swapExactNATIVEForTokens(uint256 amountOutMin, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external payable returns (uint256 amountOut)",
  "function swapExactTokensForNATIVE(uint256 amountIn, uint256 amountOutMinNATIVE, uint256[] pairBinSteps, address[] tokenPath, address payable to, uint256 deadline) external returns (uint256 amountOut)",
  "function swapTokensForExactNATIVE(uint256 amountNATIVEOut, uint256 amountInMax, uint256[] pairBinSteps, address[] tokenPath, address payable to, uint256 deadline) external returns (uint256[] amountsIn)",
  "function swapNATIVEForExactTokens(uint256 amountOut, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external payable returns (uint256[] amountsIn)",

  // Fee-on-transfer support
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external",
  "function swapExactNATIVEForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, uint256[] pairBinSteps, address[] tokenPath, address to, uint256 deadline) external payable",
  "function swapExactTokensForNATIVESupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMinNATIVE, uint256[] pairBinSteps, address[] tokenPath, address payable to, uint256 deadline) external",

  // Liquidity - Regular
  "function addLiquidity((address tokenX, address tokenY, uint256 binStep, uint256 amountX, uint256 amountY, uint256 amountXMin, uint256 amountYMin, uint256 activeIdDesired, uint256 idSlippage, int256[] deltaIds, uint256[] distributionX, uint256[] distributionY, address to, address refundTo, uint256 deadline) liquidityParameters) external returns (uint256 amountXAdded, uint256 amountYAdded, uint256 amountXLeft, uint256 amountYLeft, uint256[] depositIds, uint256[] liquidityMinted)",
  "function removeLiquidity(address tokenX, address tokenY, uint16 binStep, uint256 amountXMin, uint256 amountYMin, uint256[] ids, uint256[] amounts, address to, uint256 deadline) external returns (uint256 amountX, uint256 amountY)",

  // Liquidity - Native ETH
  "function addLiquidityNATIVE((address tokenX, address tokenY, uint256 binStep, uint256 amountX, uint256 amountY, uint256 amountXMin, uint256 amountYMin, uint256 activeIdDesired, uint256 idSlippage, int256[] deltaIds, uint256[] distributionX, uint256[] distributionY, address to, address refundTo, uint256 deadline) liquidityParameters) external payable returns (uint256 amountXAdded, uint256 amountYAdded, uint256 amountXLeft, uint256 amountYLeft, uint256[] depositIds, uint256[] liquidityMinted)",
  "function removeLiquidityNATIVE(address token, uint16 binStep, uint256 amountTokenMin, uint256 amountNATIVEMin, uint256[] ids, uint256[] amounts, address payable to, uint256 deadline) external returns (uint256 amountToken, uint256 amountNATIVE)",

  // Helper functions
  "function getSwapIn(address lbPair, uint128 amountOut, bool swapForY) external view returns (uint128 amountIn, uint128 amountOutLeft, uint128 fee)",
  "function getSwapOut(address lbPair, uint128 amountIn, bool swapForY) external view returns (uint128 amountInLeft, uint128 amountOut, uint128 fee)",
  "function getIdFromPrice(address lbPair, uint256 price) external view returns (uint24)",
  "function getPriceFromId(address lbPair, uint24 id) external view returns (uint256)",
])

export const LBFactoryABI = parseAbi([
  "function getLBPairInformation(address tokenX, address tokenY, uint256 binStep) external view returns (address lbPair, uint256 binStepOverride, bool isOpen, bool ignoredForRouting, uint256 createdByOwner)",
  "function getAllLBPairs(address tokenX, address tokenY) external view returns ((uint16 binStep, address lbPair, bool createdByOwner, bool ignoredForRouting)[] lbPairsAvailable)",
  "function getPreset(uint16 binStep) external view returns (uint256 baseFactor, uint256 filterPeriod, uint256 decayPeriod, uint256 reductionFactor, uint256 variableFeeControl, uint256 protocolShare, uint256 maxVolatilityAccumulator, bool isOpen)",
  "function createLBPair(address tokenX, address tokenY, uint24 activeId, uint16 binStep) external returns (address pair)",
])

export const LBQuoterABI = parseAbi([
  "function findBestPathFromAmountIn(address[] route, uint128 amountIn) external view returns ((address[] route, uint256[] pairs, uint256[] binSteps, uint256[] amounts, uint256[] virtualAmountsWithoutSlippage, uint256[] fees) quote)",
  "function findBestPathFromAmountOut(address[] route, uint128 amountOut) external view returns ((address[] route, uint256[] pairs, uint256[] binSteps, uint256[] amounts, uint256[] virtualAmountsWithoutSlippage, uint256[] fees) quote)",
])

export const LBPairABI = parseAbi([
  // Basic info
  "function getReservesAndId() external view returns (uint256 reserveX, uint256 reserveY, uint256 activeId)",
  "function getReserves() external view returns (uint128 reserveX, uint128 reserveY)",
  "function getBin(uint24 id) external view returns (uint128 binReserveX, uint128 binReserveY)",
  "function getTokenX() external view returns (address)",
  "function getTokenY() external view returns (address)",
  "function getBinStep() external view returns (uint16)",
  "function getActiveId() external view returns (uint24)",

  // Liquidity positions
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[] balances)",
  "function totalSupply(uint256 id) external view returns (uint256)",

  // Fee information
  "function getStaticFeeParameters() external view returns (uint16 baseFactor, uint16 filterPeriod, uint16 decayPeriod, uint16 reductionFactor, uint24 variableFeeControl, uint16 protocolShare, uint24 maxVolatilityAccumulator)",
  "function getVariableFeeParameters() external view returns (uint24 volatilityAccumulator, uint24 volatilityReference, uint24 idReference, uint40 timeOfLastUpdate)",
  "function getProtocolFees() external view returns (uint128 protocolFeeX, uint128 protocolFeeY)",

  // Price helpers
  "function getPriceFromId(uint24 id) external view returns (uint256 price)",
  "function getIdFromPrice(uint256 price) external view returns (uint24 id)",

  // Navigation
  "function getNextNonEmptyBin(bool swapForY, uint24 id) external view returns (uint24 nextId)",

  // Oracle (TWAP)
  "function getOracleParameters() external view returns (uint8 sampleLifetime, uint16 size, uint16 activeSize, uint40 lastUpdated, uint40 firstTimestamp)",
  "function getOracleSampleAt(uint40 lookupTimestamp) external view returns (uint64 cumulativeId, uint64 cumulativeVolatility, uint64 cumulativeBinCrossed)",
])

export const ERC20ABI = parseAbi([
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
])

// MemeCoin ABI with faucet functionality
export const MemeCoinABI = parseAbi([
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function faucet() external",
  "function canClaimFaucet(address account) external view returns (bool)",
  "function timeUntilNextClaim(address account) external view returns (uint256)",
  "function FAUCET_AMOUNT() external view returns (uint256)",
  "function FAUCET_COOLDOWN() external view returns (uint256)",
])

