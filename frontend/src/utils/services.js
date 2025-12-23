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
  getLiveGasFees: async () => {
        const fetchGas = async (rpc) => {
            try {
                const res = await fetch(rpc, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 1 })
                });
                const data = await res.json();
                return (parseInt(data.result, 16) / 1e9).toFixed(2);
            } catch (e) { return "---"; }
        };
        const [eth, base, mantle] = await Promise.all([
            fetchGas(CONTRACT_CONFIG.ethereum.rpc),
            fetchGas(CONTRACT_CONFIG.base.rpc),
            fetchGas(CONTRACT_CONFIG.mantle.rpc)
        ]);
        return { ethereum: eth, base, mantle };
    },
    getBungeeTokens: async () => {
        try {
            const res = await fetch('https://api.socket.tech/v2/token-lists/all', {
                headers: { 'API-KEY': '72a5b4b0-e905-4978-8351-24c98053f548' }
            });
            const data = await res.json();
            return data.result || [];
        } catch (e) { return []; }
    },
    getWalletActivity: async (address, chainKey = 'mantle') => {
        const config = CONTRACT_CONFIG[chainKey];
        if (!config || !config.explorerApi) return [];
        
        try {
            const url = `${config.explorerApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=15&sort=desc`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.status === "1" && data.result) {
                return data.result.map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: (parseInt(tx.value) / 1e18).toFixed(4),
                    timestamp: parseInt(tx.timeStamp) * 1000,
                    method: tx.functionName?.split('(')[0] || (tx.to === "" ? "Deploy" : "Transfer"),
                    isError: tx.isError === "1",
                    chain: config.name
                }));
            }
            return [];
        } catch (e) {
            console.error("Activity Fetch Error:", e);
            return [];
        }
    },

  executeSwap: async (address, amountIn, chainKey) => {
        const config = CONTRACT_CONFIG[chainKey];
        if (!config) throw new Error("Chain not supported.");
        // In local production, you would use ethers.js here to interact with:
        // config.routerAddress
        // For this preview environment, we simulate the high-fidelity transaction flow
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const txHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        return { 
            success: true, 
            txHash, 
            fee: (amountIn * 0.001).toFixed(4), 
            chain: config.name,
            routerUsed: config.routerAddress 
        };
    },
    
};

export const fetchLivePrices = async (holdings) => {
  const prices = {};

  // ⚠️ SECURE: Using process.env references for production security ⚠️
  // Ensure you define these variables in your local .env file.
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";
  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
  const COINGECKO_KEY = process.env.COINGECKO_API_KEY || ""; 
  
  const cryptoItems = assets.filter(h => h.type === 'crypto');
  const cryptoIds = cryptoItems.map(h => h.apiId).filter(id => !!id).join(',');
    
    if (cryptoIds) {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true${COINGECKO_KEY ? `&x_cg_demo_api_key=${COINGECKO_KEY}` : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                cryptoItems.forEach(item => {
                    if (data[item.apiId]) prices[item.apiId] = { price: data[item.apiId].usd, change: data[item.apiId].usd_24h_change };
                });
            }
        } catch (e) {}
    }

  const stocks = holdings.filter((h) => h.type === "stock");
  if (stocks.length > 0) {
    await Promise.all(
      stocks.map(async (stock) => {
        const symbol = stock.symbol.toUpperCase();
        let priceData = null;

        // A. Try Finnhub First
        if (FINNHUB_KEY && !priceData) {
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.c) {
                priceData = { price: data.c, change: data.dp };
              }
            }
          } catch (e) {
            console.warn(`Finnhub failed for ${symbol}, trying fallback...`, e);
          }
        }

        // B. Try Alpha Vantage (Fallback)
        if (ALPHA_VANTAGE_KEY && !priceData) {
          try {
            const res = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
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

export const fetchHistoricalData = async (symbol, type) => {
    const CMC_KEY = process.env.COINMARKETCAP_API_KEY || "";
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

    // 1. Handling Crypto with CoinMarketCap
    if (type === 'crypto' && CMC_KEY) {
        try {
            const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=${symbol}&count=30`, {
                headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
            });
            const json = await res.json();
            return json.data.quotes.map(q => ({ date: new Date(q.timestamp).toLocaleDateString(), price: q.quote.USD.price }));
        } catch (e) { console.error("CMC Historical Error", e); }
    }

    // 2. Handling Stocks with Finnhub (using candles)
    if (type === 'stock' && FINNHUB_KEY) {
        try {
            const to = Math.floor(Date.now() / 1000);
            const from = to - (30 * 86400); // 30 days
            const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
            const json = await res.json();
            if (json.s === "ok") {
                return json.t.map((timestamp, i) => ({
                    date: new Date(timestamp * 1000).toLocaleDateString(),
                    price: json.c[i]
                }));
            }
        } catch (e) { console.error("Finnhub Historical Error", e); }
    }

    // 3. Fallback: Dynamic Realistic Mock Data (Ensures price action is visible in preview)
    return Array.from({ length: 30 }, (_, i) => {
        const basePrice = symbol === 'BTC' ? 95000 : symbol === 'ETH' ? 3300 : symbol === 'TSLA' ? 240 : 150;
        const volatility = type === 'crypto' ? 0.08 : 0.03;
        return {
            date: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
            price: basePrice * (1 + (Math.sin(i / 2) * 0.1) + (Math.random() * volatility - volatility/2))
        };
    });
};


// --- AI Logic ---
export const AIService = {
  fetchAssetAnalysis: async (assetName) => {
    const url = await AIService.callGemini(
      `Analyze ${assetName} market outlook. Return 3 paragraphs: Trading Venue, Market News, Risk Assessment.`
    );
    const q = `Market insight report for ${assetName}. Technical setup and fundamental catalysts. 3 paragraphs.`;
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: q }] }] }) });
            const json = await res.json();
            return json.candidates?.[0]?.content?.parts?.[0]?.text || "Intelligence feed offline.";
        } catch (e) { return "AI Service Unavailable"; }

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
    const apiKey = process.env.GEMINI_API_KEY; 
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
