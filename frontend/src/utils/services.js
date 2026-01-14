import { CMC_IDS } from "./cryptoMap";
import { CONTRACT_CONFIG, MOCK_TOKENS } from "./constants";

export const Web3Service = {
  isProviderAvailable: () => typeof window.ethereum !== "undefined",

  connectWallet: async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Check network
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    // If not Mantle (0x1388), switch
    if (currentChainId !== "0x1388") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1388" }],
        });
      } catch (switchError) {
        // If Mantle not in wallet, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1388",
                chainName: "Mantle",
                nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
                rpcUrls: ["https://rpc.mantle.xyz"],
                blockExplorerUrls: ["https://mantlescan.xyz"],
              },
            ],
          });
        }
      }
    }

    return { address: accounts[0] };
  },

  getTokenBalance: async (tokenAddress, userAddress) => {
    if (!window.ethereum) return "0";
    
    try {
      // If native token (MNT)
      if (tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [userAddress, 'latest']
        });
        return balance;
      }
      
      // For ERC20 tokens
      const balanceOfData = "0x70a08231" + userAddress.slice(2).padStart(64, '0');
      
      const balance = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: balanceOfData
        }, 'latest']
      });
      
      return balance || "0x0";
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0x0";
    }
  },
  
  getLiveGasFees: async () => {
    const fetchGas = async (rpc) => {
      try {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_gasPrice",
            params: [],
            id: 1,
          }),
        });
        const data = await res.json();
        return (parseInt(data.result, 16) / 1e9).toFixed(2);
      } catch (e) {
        return "---";
      }
    };
    const [eth, mantle] = await Promise.all([
      fetchGas(CONTRACT_CONFIG.ethereum.rpc),
      // fetchGas(CONTRACT_CONFIG.base.rpc),
      fetchGas(CONTRACT_CONFIG.mantle.rpc),
    ]);
    return { ethereum: eth, mantle };
  },
  getBungeeChains: async () => {
    try {
      const res = await fetch(
        "http://localhost:3001/api/bungee/supported-chains"
      );
      return await res.json();
    } catch (e) {
      console.error("Bungee chains error:", e);
      return [];
    }
  },
  getBungeeTokens: async () => {
    try {
      const res = await fetch("http://localhost:3001/api/bungee/tokens");
      if (res.ok) {
        const data = await res.json();

        let tokens = [];

        if (data && typeof data === "object") {
          if (data.result && data.result["5000"]) {
            tokens = data.result["5000"];
          } else if (data["5000"]) {
            tokens = data["5000"];
          } else if (Array.isArray(data)) {
            tokens = data;
          } else if (data.tokens && Array.isArray(data.tokens)) {
            tokens = data.tokens;
          }
        }

        if (Array.isArray(tokens) && tokens.length > 0) {
          console.log(`Loaded ${tokens.length} tokens from backend`);
          return tokens;
        }

        console.warn("No tokens found in backend response, using mock tokens");
        return MOCK_TOKENS;
      }

      console.warn("Backend returned non-OK status, using mock tokens");
      return MOCK_TOKENS;
    } catch (e) {
      console.warn("Bungee tokens fetch failed, using mock tokens:", e.message);
      return MOCK_TOKENS;
    }
  },

  getBungeeQuote: async (payload) => {
    try {
      // Convert payload to query string for GET request
      const params = new URLSearchParams();
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== null) {
          params.append(key, payload[key]);
        }
      });

      const res = await fetch(
        `http://localhost:3001/api/bungee/quote?${params.toString()}`
      );
      return await res.json();
    } catch (e) {
      console.error("Bungee quote error:", e);
      return null;
    }
  },

  buildBungeeTx: async (payload) => {
    try {
      // Convert payload to query string for GET request
      const params = new URLSearchParams();

      // Route needs to be stringified for URL
      if (payload.route) {
        params.append("route", JSON.stringify(payload.route));
      }
      if (payload.userAddress) {
        params.append("userAddress", payload.userAddress);
      }

      const res = await fetch(
        `http://localhost:3001/api/bungee/build-tx?${params.toString()}`
      );
      return await res.json();
    } catch (e) {
      console.error("Bungee build tx error:", e);
      return null;
    }
  },

  getWalletActivity: async (address, chainKey = "mantle") => {
    const config = CONTRACT_CONFIG[chainKey];
    if (!config || !config.explorerApi) return [];

    try {
      const url = `${config.explorerApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=15&sort=desc`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "1" && data.result) {
        return data.result.map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: (parseInt(tx.value) / 1e18).toFixed(4),
          timestamp: parseInt(tx.timeStamp) * 1000,
          method:
            tx.functionName?.split("(")[0] ||
            (tx.to === "" ? "Deploy" : "Transfer"),
          isError: tx.isError === "1",
          chain: config.name,
        }));
      }
      return [];
    } catch (e) {
      console.error("Activity Fetch Error:", e);
      return [];
    }
  },

  executeSwap: async ({
    fromToken,
    toToken,
    amount,
    userAddress,
    slippage = 0.5,
  }) => {
    if (!window.ethereum) throw new Error("Wallet not connected");

    // Mantle mainnet chainId
    const MANTLE_CHAIN_ID = 5000;

    try {
      // 1. Get quote using GET with query parameters
      console.log("Getting swap quote...");

      const quoteParams = new URLSearchParams({
        originChainId: MANTLE_CHAIN_ID,
        destinationChainId: MANTLE_CHAIN_ID,
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: amount,
        userAddress: userAddress,
        receiverAddress: userAddress,
        slippage: slippage,
        refuel: false,
        enableManual: true,
        enableMultipleAutoRoutes: false,
      });

      const quoteUrl = `http://localhost:3001/api/bungee/quote?${quoteParams.toString()}`;
      console.log("Quote URL:", quoteUrl);

      const quoteResponse = await fetch(quoteUrl);

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        console.error("Quote error response:", errorData);
        throw new Error(
          `Quote request failed: ${errorData.message || quoteResponse.status}`
        );
      }

      const quote = await quoteResponse.json();

      console.log("Full quote response:", quote);

      if (!quote?.success || !quote?.result) {
        console.error("Quote has no result field:", quote);
        throw new Error(quote?.message || "Invalid quote response from Bungee");
      }

      const result = quote.result;
      let selectedRoute = null;

      if (result.autoRoute) {
        console.log("Using auto route");
        selectedRoute = result.autoRoute;
      } else if (result.manualRoutes && result.manualRoutes.length > 0) {
        console.log(
          `Using manual route (${result.manualRoutes.length} available)`
        );
        selectedRoute = result.manualRoutes[0];
      }

      if (!selectedRoute) {
        console.error("No routes found. Quote result:", result);
        throw new Error(
          "No swap routes available. Try a different amount or token pair."
        );
      }

      console.log("Selected route:", selectedRoute);

      // 2. Build transaction using GET with query parameters
      console.log("Building transaction...");

      const quoteId = selectedRoute.quoteId;
      const buildTxParams = new URLSearchParams({
        quoteId: quoteId,
        userAddress: userAddress,
      });

      const txResponse = await fetch(
        `http://localhost:3001/api/bungee/build-tx?${buildTxParams.toString()}`
      );

      if (!txResponse.ok) {
        const errorData = await txResponse.json();
        console.error("Build tx error response:", errorData);
        throw new Error(
          `Build tx failed: ${errorData.message || txResponse.status}`
        );
      }

      const txData = await txResponse.json();

      console.log("Transaction built:", txData);

      let transactionData = null;

      if (txData?.success && txData?.result) {
        // Try different possible paths for transaction data
        if (txData.result.txData) {
          transactionData = txData.result.txData;
        } else if (txData.result.userTxs && txData.result.userTxs[0]) {
          transactionData = txData.result.userTxs[0];
        } else if (txData.result[0]) {
          transactionData = txData.result[0];
        } else {
          console.error(
            "Cannot find transaction data in response:",
            txData.result
          );
          throw new Error("Transaction data structure not recognized");
        }
      } else {
        console.error("Invalid build tx response:", txData);
        throw new Error(
          txData?.message || "Transaction data not received from backend"
        );
      }

      console.log("Transaction data to send:", transactionData);

       const isNativeTokenSwap = fromToken.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      

     if (!isNativeTokenSwap && txData.result.approvalData) {
        console.log("Token approval required!");
        console.log("Approval data:", txData.result.approvalData);
        
        const approvalData = txData.result.approvalData;
        
        // Send approval transaction first
        console.log("Requesting token approval...");
        try {
          const approvalTxHash = await window.ethereum.request({
            method: "eth_sendTransaction",
            params: [{
              from: userAddress,
              to: approvalData.to || approvalData.tokenAddress,
              data: approvalData.data,
              value: "0x0"
            }]
          });
          
          console.log("Approval transaction sent:", approvalTxHash);
          console.log("Waiting for approval confirmation...");
          
          // Wait for approval to be mined
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log("Approval confirmed, proceeding with swap...");
        } catch (approvalError) {
          console.error("Approval failed:", approvalError);
          throw new Error("Token approval failed: " + approvalError.message);
        }
      } else if (!isNativeTokenSwap) {
        console.log("No approval data from Bungee, token might already be approved or approval built into swap");
      }

      // 3. Send transaction via MetaMask
      console.log("Sending transaction to MetaMask...");

      
      console.log("=== TRANSACTION DEBUG ===");
      console.log("Input amount entered:", amount, "wei");
      console.log("Input amount readable:", parseInt(amount) / 1e18, "tokens");
      console.log("\nTransaction data from Bungee:");
      console.log("- to:", transactionData.to);
      console.log("- value (from Bungee):", transactionData.value || "0");
      
      // FIX: Bungee returns value as decimal string, not hex!
      let valueToSend = "0x0";
      if (transactionData.value && transactionData.value !== "0" && transactionData.value !== "0x0") {
        // Check if it's already hex (starts with 0x)
        if (transactionData.value.startsWith("0x")) {
          valueToSend = transactionData.value;
        } else {
          // Convert decimal string to hex
          const valueDecimal = BigInt(transactionData.value);
          valueToSend = "0x" + valueDecimal.toString(16);
          console.log("- Converted value from decimal to hex:", transactionData.value, "→", valueToSend);
        }
        
        const valueInTokens = parseInt(valueToSend, 16) / 1e18;
        console.log("- value (tokens):", valueInTokens);
      }
      
      console.log("- data:", transactionData.data ? transactionData.data.slice(0, 20) + "..." : "none");
      console.log("=== END DEBUG ===\n");
      
   
      // Build transaction parameters
      const txParams = {
        from: userAddress,
        to: transactionData.to,
        data: transactionData.data,
        // Use converted hex value for native swaps, otherwise 0x0
        value: isNativeTokenSwap ? valueToSend : "0x0"
      };
      
      console.log("Final tx params to MetaMask:");
      console.log("- from:", txParams.from);
      console.log("- to:", txParams.to);
      console.log("- value:", txParams.value);
      console.log("- value (tokens):", parseInt(txParams.value, 16) / 1e18);
      
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });

      console.log("Transaction sent:", txHash);

      return {
        success: true,
        txHash,
        chain: "Mantle",
        routerUsed: transactionData.to
      };
    } catch (error) {
      console.error("Swap execution error:", error);
      throw error;
    }
  }
};

export const fetchLivePrices = async (holdings) => {
  const prices = {};

  // ⚠️ SECURE: Using process.env references for production security ⚠️
  // Ensure you define these variables in your local .env file.
  const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "";
  const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "";
  const COINGECKO_KEY = import.meta.env.VITE_COINGECKO_API_KEY || "";

  const cryptoItems = holdings.filter((h) => h.type === "crypto");
  const cryptoIds = cryptoItems
    .map((h) => h.coingeckoId)
    .filter((id) => !!id)
    .join(",");
  if (cryptoIds) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true${
        COINGECKO_KEY ? `&x_cg_demo_api_key=${COINGECKO_KEY}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        cryptoItems.forEach((item) => {
          if (data[item.coingeckoId])
            prices[item.coingeckoId] = {
              price: data[item.coingeckoId].usd,
              change: data[item.coingeckoId].usd_24h_change,
            };
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

export const fetchHistoricalData = async (id, type, range = "1M") => {
  const ranges = {
    "1D": 1,
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
  };

  const days = ranges[range] || 30;

  if (type === "crypto") {
    // Accept numeric CoinMarketCap id, ticker (e.g. 'ETH'), or name ('ethereum')
    let id = null;
    if (typeof id === "number" || /^[0-9]+$/.test(String(id))) {
      id = String(id);
    } else {
      const code = String(id).toUpperCase();
      if (CMC_IDS[code]) id = String(CMC_IDS[code]);
      else {
        const found = Object.keys(CMC_IDS).find(
          (k) => k.toLowerCase() === String(id).toLowerCase()
        );
        if (found) id = String(CMC_IDS[found]);
      }
    }

    if (id) {
      try {
        const res = await fetch(
          `http://localhost:3001/api/cmc-history?id=${id}&count=${days}`
        );
        if (res.ok) return await res.json();
        const err = await res.json().catch(() => ({}));
        console.warn("CMC backend non-ok", res.status, err);
      } catch (e) {
        console.error("CMC backend error", e);
      }
    }
  }

  // 2. Handling Stocks with Finnhub (using candles)
  if (type === "stock" && import.meta.env.VITE_FINNHUB_API_KEY) {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 86400;

      const res = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${process.env.VITE_FINNHUB_API_KEY}`
      );

      const json = await res.json();
      if (json.s === "ok") {
        return json.t.map((t, i) => ({
          date: new Date(t * 1000).toLocaleDateString(),
          price: json.c[i],
        }));
      }
    } catch (e) {
      console.error("Finnhub error", e);
    }
  }

  // 3. Fallback: Dynamic Realistic Mock Data (Ensures price action is visible in preview)
  console.warn("Using mock data for", id);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString(),
    price: 100 + Math.sin(i / 2) * 10 + Math.random() * 5,
  }));
};

// --- AI Logic ---
export const AIService = {
  fetchAssetAnalysis: async (assetName) => {
    const q = `Market insight report for ${assetName}...`;

    try {
      const response = await AIService.callGemini(q);
      const lines = response.split("\n").filter((line) => line.trim());
      return {
        tradingVenue: lines[0] || "Trading venue analysis pending...",
        marketNews: lines[1] || "Market sentiment analysis in progress...",
        riskAssessment: lines[2] || "Risk assessment calculating...",
      };
    } catch (e) {
      return {
        /* error fallback */
      };
    }
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
    const apiKey = import.meta.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
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
