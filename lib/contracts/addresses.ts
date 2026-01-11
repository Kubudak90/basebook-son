// Base Sepolia Contract Addresses - New Deployment Dec 20, 2024
export const CONTRACTS = {
  LBFactory: "0x1aF4454bdcE78b2D130b4CD8fcd867195b7a2D1B",
  LBRouter: "0xFF9a6f598CaD576E45c44d2238CFF785CE089433",
  LBQuoter: "0xDE43cABB9F8a2e4B79059f72748EcacF8Eef0df5",
  LBPairImplementation: "0x7B3d501f0FA7c63e65c4aABEaa9a967841CC1b5E",
} as const

// Base Sepolia Chain Config
export const BASE_SEPOLIA_CHAIN = {
  id: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
    public: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
  },
  testnet: true,
} as const

// Common tokens on Base Sepolia (update with actual addresses)
export const TOKENS = {
  WETH: {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  USDC: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  EURC: {
    address: "0x808456652fdb597867f38412077A9182bf77359F",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/20641.png",
  },
  // === MEME COINS (Fake - Deploy your own ERC20s or update addresses) ===
  DOGE: {
    address: "0x000000000000000000000000000000000000D06E", // Placeholder
    symbol: "DOGE",
    name: "Dogecoin",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  },
  PEPE: {
    address: "0xB4c0b1B1d68543595c88a8a5761F3e5a49D80Ba7", // Deployed on Base Sepolia (24h cooldown)
    symbol: "PEPE",
    name: "Pepe",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/pepe-pepe-logo.png",
    hasFaucet: true, // Users can claim 1000 tokens every hour
  },
  SHIB: {
    address: "0x000000000000000000000000000000000051418B", // Placeholder
    symbol: "SHIB",
    name: "Shiba Inu",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/shiba-inu-shib-logo.png",
  },
  BONK: {
    address: "0x0000000000000000000000000000000000B0B0NK", // Placeholder
    symbol: "BONK",
    name: "Bonk",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/bonk-bonk-logo.png",
  },
  WIF: {
    address: "0x0000000000000000000000000000000000000W1F", // Placeholder
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png",
  },
  FLOKI: {
    address: "0x00000000000000000000000000000000000FL0K1", // Placeholder
    symbol: "FLOKI",
    name: "Floki Inu",
    decimals: 18,
    logoURI: "https://cryptologos.cc/logos/floki-inu-floki-logo.png",
  },
  BRETT: {
    address: "0x9BC54af6fa1e613cE9b48a965165F706e574d1AB", // Deployed on Base Sepolia (24h cooldown)
    symbol: "BRETT",
    name: "Brett",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/29743.png",
    hasFaucet: true, // Users can claim 1000 tokens every hour
  },
  TOSHI: {
    address: "0x000000000000000000000000000000000T0SH111", // Placeholder
    symbol: "TOSHI",
    name: "Toshi",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/27804.png",
  },
} as const
