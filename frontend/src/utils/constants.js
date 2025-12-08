export const CONTRACT_CONFIG = {
    base: { chainId: '0x2105', routerAddress: '0xYourBaseContract', dexRouter: '0x...' },
    bnb: { chainId: '0x38', routerAddress: '0xYourBNBContract', dexRouter: '0x...' }
};

export const MOCK_HOLDINGS = [
    { id: '1', type: 'crypto', symbol: 'ETH', apiId: 'ethereum', name: 'Ethereum', quantity: 5.2, purchasePrice: 2500, price: 0, change: 0 },
    { id: '2', type: 'crypto', symbol: 'BTC', apiId: 'bitcoin', name: 'Bitcoin', quantity: 0.45, purchasePrice: 45000, price: 0, change: 0 },
    { id: '3', type: 'stock', symbol: 'TSLA', apiId: 'tesla', name: 'Tesla', quantity: 15, purchasePrice: 180, price: 210, change: 1.2 },
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