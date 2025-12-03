export const appId = typeof __app_id !== 'undefined' ? __app_id : 'trackpad-default-app-id';
export const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const MOCK_HOLDINGS = [
  { id: '1', type: 'crypto', symbol: 'ETH', name: 'Ethereum', quantity: 5.2, price: 3800.5, change: 4.25, logo: 'https://placehold.co/24x24/f0f9ff/0f172a?text=E' },
  { id: '2', type: 'crypto', symbol: 'BTC', name: 'Bitcoin', quantity: 0.8, price: 62500.2, change: -1.88, logo: 'https://placehold.co/24x24/f0f9ff/0f172a?text=B' },
  { id: '3', type: 'stock', symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 150, price: 175.3, change: 1.12, logo: 'https://placehold.co/24x24/f0f9ff/0f172a?text=G' },
  { id: '4', type: 'stock', symbol: 'TSLA', name: 'Tesla Inc.', quantity: 200, price: 185.0, change: -3.5, logo: 'https://placehold.co/24x24/f0f9ff/0f172a?text=T' },
];

export const DEFAULT_AI_RESPONSE = {
  tradingVenue: "Select an asset and click 'Analyze' to generate AI insights...",
  marketNews: "The AI will summarize relevant news here.",
  riskAssessment: "The AI will provide a risk and volatility assessment here."
};

export const THEME_CLASSES = {
  light: {
    bgPrimary: 'bg-white', bgSecondary: 'bg-gray-100', textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-500', accentBg: 'bg-blue-600 hover:bg-blue-700',
    accentText: 'text-blue-600', border: 'border-gray-200', shadow: 'shadow-lg',
    pnlPositive: 'text-green-600 bg-green-50', pnlNegative: 'text-red-600 bg-red-50',
  },
  dark: {
    bgPrimary: 'bg-gray-900', bgSecondary: 'bg-gray-800', textPrimary: 'text-gray-50',
    textSecondary: 'text-gray-400', accentBg: 'bg-yellow-500 hover:bg-yellow-600',
    accentText: 'text-yellow-400', border: 'border-gray-700', shadow: 'shadow-2xl shadow-gray-950/50',
    pnlPositive: 'text-green-400 bg-green-900', pnlNegative: 'text-red-400 bg-red-900',
  }
};
