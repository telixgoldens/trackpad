export const CONTRACT_CONFIG = {
    base: { 
        chainId: '0x2105',
        routerAddress: '0x_WAITING_FOR_ROUTER_ON_BASE', 
        gateway: '0x3a23F943181408EAC424116Af7b7790c94Cb97a5',
        rpc: 'https://mainnet.base.org',
        explorerApi: 'https://api.basescan.org/api'
    },
    mantle: { 
        chainId: '0x1388', 
        routerAddress: '0x85de3b7b75589f450f24bbfe0c02066a38716c37', 
        gateway: '0x3a23F943181408EAC424116Af7b7790c94Cb97a5',
        rpc: 'https://rpc.mantle.xyz',
        explorerApi: 'https://api.mantlescan.xyz/api' 
    },
     ethereum: {
        chainId: '0x1',
        name: 'Ethereum',
        rpc: 'https://eth.llamarpc.com'
    }
};

export const MOCK_HOLDINGS = [
    { id: '1', type: 'crypto', symbol: 'ETH', coingeckoId: 'ethereum', cmcSymbol: 'ETH', name: 'Ethereum', quantity: 5.2, purchasePrice: 2500, price: 0, change: 0 },
    { id: '2', type: 'crypto', symbol: 'BTC', coingeckoId: 'bitcoin', cmcSymbol: 'BTC', name: 'Bitcoin', quantity: 0.45, purchasePrice: 45000, price: 0, change: 0 },
    { id: '3', type: 'stock', symbol: 'TSLA', coingeckoId: 'tesla', name: 'Tesla', quantity: 15, purchasePrice: 180, price: 210, change: 1.2 },
];

export const DEFAULT_AI_RESPONSE = {
    tradingVenue: "Select an asset and click 'Analyze' to generate AI insights...",
    marketNews: "The AI will summarize relevant news here.",
    riskAssessment: "The AI will provide a risk and volatility assessment here."
};

export const THEME_CLASSES = {
    light: { bgPrimary: 'bg-white', bgSecondary: 'bg-gray-100', textPrimary: 'text-gray-900', textSecondary: 'text-gray-500', accentBg: 'bg-blue-600 hover:bg-blue-700', accentText: 'text-blue-600', border: 'border-gray-200', shadow: 'shadow-lg', pnlPositive: 'text-green-600 bg-green-50', pnlNegative: 'text-red-600 bg-red-50' },
    dark: { bgPrimary: 'bg-gray-900', bgSecondary: 'bg-gray-800', textPrimary: 'text-gray-50', textSecondary: 'text-gray-400', accentBg: 'bg-yellow-500 hover:bg-yellow-600', accentText: 'text-yellow-400', border: 'border-gray-700', shadow: 'shadow-2xl shadow-gray-950/50', pnlPositive: 'text-green-400 bg-green-900', pnlNegative: 'text-red-400 bg-red-900' }
};

export const MOCK_TOKENS= [
      { symbol: "MNT", name: "Mantle", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" },
      { symbol: "USDC", name: "USD Coin", address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9" },
      { symbol: "USDT", name: "Tether", address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE" },
      { symbol: "WETH", name: "Wrapped Ethereum", address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111" },
      { symbol: "WMNT", name: "Wrapped Mantle", address: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d" },
      { symbol: "USDY", name: "USDY", address: "0x5bE26527e817998A7206475496fDE1E68957c5A6" },
      { symbol: "FBTC", name: "Fintegra Bitcoin", address: "0xC96dE26018A54D51c097160568752c4E3BD6C364" },
      { symbol: "METH", name: "Mantle Staked ETH", address: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0" }
    ];