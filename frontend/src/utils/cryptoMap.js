export const CMC_IDS = {
  BTC: 1,
  BITCOIN: 1,
  ETH: 1027,
  ETHEREUM: 1027,
  USDT: 825,
  TETHER: 825,
  BNB: 1839,
  BINANCE: 1839,
  SOL: 5426,
  SOLANA: 5426,
  USDC: 3408,
  XRP: 52,
  RIPPLE: 52,
  ADA: 2010,
  CARDANO: 2010,
  AVAX: 5805,
  AVALANCHE: 5805,
  DOGE: 74,
  DOGECOIN: 74,
  DOT: 6636,
  POLKADOT: 6636,
  MATIC: 3890,
  POLYGON: 3890,
  TRX: 1958,
  TRON: 1958,
  LINK: 1975,
  CHAINLINK: 1975,
  
  
  UNI: 7083,
  UNISWAP: 7083,
  AAVE: 7278,
  CRV: 6538,
  CURVE: 6538,
  MKR: 1518,
  MAKER: 1518,
  COMP: 5692,
  COMPOUND: 5692,
  SNX: 2586,
  SYNTHETIX: 2586,
  SUSHI: 6758,
  SUSHISWAP: 6758,
  YFI: 5864,
  
  // Layer 2 / Scaling
  ARB: 11841,
  ARBITRUM: 11841,
  OP: 11840,
  OPTIMISM: 11840,
  IMX: 10603,
  IMMUTABLE: 10603,
  LRC: 1934,
  LOOPRING: 1934,
  MNT: 27075,
  MANTLE: 27075,
  
  // Meme Coins
  SHIB: 5994,
  SHIBAINU: 5994,
  PEPE: 24478,
  FLOKI: 10804,
  
  // Stablecoins
  DAI: 4943,
  BUSD: 4687,
  TUSD: 2563,
  USDD: 19891,
  FRAX: 6952,
  
  // Exchange Tokens
  FTT: 4195,
  CRO: 3635,
  CRYPTO: 3635,
  OKB: 3897,
  LEO: 3957,
  
  // Gaming / Metaverse
  SAND: 6210,
  SANDBOX: 6210,
  MANA: 1966,
  DECENTRALAND: 1966,
  AXS: 6783,
  AXIE: 6783,
  GALA: 7080,
  ENJ: 2130,
  ENJIN: 2130,
  
  // Web3 / Infrastructure
  FIL: 2280,
  FILECOIN: 2280,
  GRT: 6719,
  GRAPH: 6719,
  ATOM: 3794,
  COSMOS: 3794,
  NEAR: 6535,
  APT: 21794,
  APTOS: 21794,
  SUI: 20947,
  
  // Privacy Coins
  XMR: 328,
  MONERO: 328,
  ZEC: 1437,
  ZCASH: 1437,
  DASH: 131,
  
  // Other Popular
  LTC: 2,
  LITECOIN: 2,
  ETC: 1321,
  BCH: 1831,
  XLM: 512,
  STELLAR: 512,
  ALGO: 4030,
  ALGORAND: 4030,
  VET: 3077,
  VECHAIN: 3077,
  ICP: 8916,
  THETA: 2416,
  FTM: 3513,
  FANTOM: 3513,
  EOS: 1765,
  HBAR: 4642,
  HEDERA: 4642,
  QNT: 3155,
  QUANT: 3155,
  RUNE: 4157,
  THORCHAIN: 4157,
  KCS: 2087,
  XTZ: 2011,
  TEZOS: 2011,
  FLOW: 4558,
  EGLD: 6892,
  ELROND: 6892,
  MINA: 8646,
  
  // AI / Data
  FET: 3773,
  FETCH: 3773,
  OCEAN: 3911,
  RNDR: 5690,
  RENDER: 5690,
  AGIX: 2424,
  
  // Real World Assets
  ONDO: 22202,
  RWA: 22202,
  
  // Base Ecosystem
  BRETT: 29743,
  DEGEN: 30125,
  
  // Add more as needed
};

// Reverse mapping: ID to Symbol
export const CMC_SYMBOLS = Object.entries(CMC_IDS).reduce((acc, [symbol, id]) => {
  if (!acc[id]) {
    acc[id] = symbol;
  }
  return acc;
}, {});

// Helper function to get CMC ID from symbol
export const getCmcId = (symbol) => {
  if (!symbol) return null;
  
  const upperSymbol = String(symbol).toUpperCase();
  return CMC_IDS[upperSymbol] || null;
};

// Helper function to get symbol from CMC ID
export const getSymbolFromCmcId = (id) => {
  return CMC_SYMBOLS[id] || null;
};

// Validate if a symbol has a CMC ID
export const hasCmcId = (symbol) => {
  const upperSymbol = String(symbol).toUpperCase();
  return upperSymbol in CMC_IDS;
};