// src/utils/chartHelpers.js
import { MOCK_HOLDINGS } from './constants';

export const generateMockHistoricalData = (assetSymbol) => {
  const basePrice = MOCK_HOLDINGS.find(a => a.symbol === assetSymbol)?.price || 100;
  const volatilityFactor = assetSymbol === 'BTC' ? 1.5 : (assetSymbol.length % 3) + 2;
  let data = [];
  let currentPrice = basePrice * (1 + (Math.random() * 0.1) - 0.05);

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.5) * volatilityFactor * 0.005;
    currentPrice *= (1 + change);
    if (currentPrice < 1) currentPrice = 1;

    data.push({ date: date.toISOString().split('T')[0], price: currentPrice });
  }
  return data;
};
