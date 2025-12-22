export const Web3Service = {
  isProviderAvailable: () => typeof window.ethereum !== "undefined",

  connectWallet: async () => {
    if (!window.ethereum) throw new Error("MetaMask not found.");
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return { address: accounts[0] };
    } catch (error) {
      console.error(error);
      throw new Error("User denied account access");
    }
  },

  executeSwap: async (address, tokenIn, tokenOut, amountIn, chainKey) => {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const txHash =
      "0x" +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    return {
      success: true,
      txHash: txHash.substring(0, 10) + "...",
      feePaid: `${(amountIn * 0.001).toFixed(4)}`,
      network: chainKey.toUpperCase(),
    };
  },

  getGasFees: async () => {
    return {
      ethereum: Math.floor(Math.random() * 15 + 10),
      base: Math.random().toFixed(4),
      bnb: Math.floor(Math.random() * 3 + 1),
    };
  },
};

// --- UTILS/marketDataService.js (STOCKS & CRYPTO) ---
export const fetchLivePrices = async (holdings) => {
  const prices = {};

  // ⚠️ SECURE: Using process.env references for production security ⚠️
  // Ensure you define these variables in your local .env file.
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
  // -------------------------------------------------------------------

  // 1. Fetch Crypto (CoinGecko)
  const cryptoIds = holdings
    .filter((h) => h.type === "crypto" && h.apiId)
    .map((h) => h.apiId)
    .join(",");
  if (cryptoIds) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`
      );
      if (response.ok) {
        const data = await response.json();
        Object.keys(data).forEach((id) => {
          prices[id] = { price: data[id].usd, change: data[id].usd_24h_change };
        });
      }
    } catch (e) {
      console.error("Crypto API Error", e);
    }
  }

  // 2. Fetch Stocks (Finnhub -> Alpha Vantage -> Mock)
  const stocks = holdings.filter((h) => h.type === "stock");
  if (stocks.length > 0) {
    await Promise.all(
      stocks.map(async (stock) => {
        const symbol = stock.symbol.toUpperCase();
        let priceData = null;

        // A. Try Finnhub First
        if (FINNHUB_API_KEY && !priceData) {
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
            );
            if (res.ok) {
              const data = await res.json();
              // Finnhub returns { c: current price, dp: percent change }
              if (data.c) {
                priceData = { price: data.c, change: data.dp };
              }
            }
          } catch (e) {
            console.warn(`Finnhub failed for ${symbol}, trying fallback...`, e);
          }
        }

        // B. Try Alpha Vantage (Fallback)
        if (ALPHA_VANTAGE_API_KEY && !priceData) {
          try {
            const res = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
            );
            if (res.ok) {
              const data = await res.json();
              const quote = data["Global Quote"];
              if (quote && quote["05. price"]) {
                priceData = {
                  price: parseFloat(quote["05. price"]),
                  change: parseFloat(
                    quote["10. change percent"].replace("%", "")
                  ),
                };
              }
            }
          } catch (e) {
            console.warn(`Alpha Vantage failed for ${symbol}`, e);
          }
        }

        // C. Final Fallback: Realistic Mock Data (if no keys or both APIs fail)
        if (!priceData) {
          const mockPrice =
            stock.purchasePrice * (1 + (Math.random() * 0.05 - 0.02));
          priceData = { price: mockPrice, change: Math.random() * 4 - 2 };
        }

        prices[symbol] = priceData;
      })
    );
  }

  return prices;
};

// --- AI Logic ---
export const AIService = {
  fetchAssetAnalysis: async (assetName) => {
    return AIService.callGemini(
      `Analyze ${assetName} market outlook. Return 3 paragraphs: Trading Venue, Market News, Risk Assessment.`
    );
  },
  fetchDailyRecap: async () => {
    return AIService.callGemini(
      `Generate a "Daily Market Recap". 1. BTC/ETH action. 2. Macro event. 3. Trending sector. Format with emojis, <150 words.`
    );
  },
  fetchPortfolioStrategy: async (portfolioData) => {
    const prompt = `
        You are a ruthless Chief Investment Officer (CIO). Analyze this portfolio JSON: 
        ${JSON.stringify(portfolioData)}
        
        Provide a strategic report in this exact JSON format (do not use Markdown code blocks):
        {
            "riskScore": number (0-100, where 100 is extreme risk),
            "healthCheck": "string (Short summary of diversification)",
            "actionPlan": ["string (bullet point 1)", "string (bullet point 2)", "string (bullet point 3)"],
            "verdict": "string (Bullish/Bearish/Neutral statement)"
        }
        `;
    const responseText = await AIService.callGemini(prompt);
    try {
      const jsonString = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("AI JSON Parse Error", e);
      return {
        riskScore: 50,
        healthCheck: "AI Parsing Error",
        actionPlan: ["Check connection", "Retry analysis"],
        verdict: "Neutral",
      };
    }
  },
  callGemini: async (userQuery) => {
    const apiKey = ""; // Insert your Google Gemini API Key here
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: userQuery }] }] };
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "AI Busy.";
    } catch (e) {
      return "AI Service Unavailable.";
    }
  },
};

// --- Chart Helpers ---
export const generateMockHistoricalData = (assetSymbol, currentPrice) => {
  const basePrice = currentPrice || 100;
  let data = [];
  let price = basePrice * 0.9;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price *= 1 + (Math.random() * 0.1 - 0.04);
    if (i === 0 && currentPrice) price = currentPrice;
    data.push({
      date: date.toISOString().split("T")[0],
      price: Math.max(0.01, price),
    });
  }
  return data;
};
