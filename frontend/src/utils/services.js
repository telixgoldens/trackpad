import { CMC_IDS } from "./cryptoMap";
import { CONTRACT_CONFIG, MOCK_TOKENS } from "./constants";

export const Web3Service = {
  isProviderAvailable: () => typeof window.ethereum !== "undefined",

  connectWallet: async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId !== "0x1388") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1388" }],
        });
      } catch (switchError) {
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
      if (
        tokenAddress.toLowerCase() ===
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [userAddress, "latest"],
        });
        return balance;
      }

      const balanceOfData =
        "0x70a08231" + userAddress.slice(2).padStart(64, "0");

      const balance = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: balanceOfData,
          },
          "latest",
        ],
      });

      return balance || "0x0";
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0x0";
    }
  },

  getTokenDecimals: async (tokenAddress) => {
    if (!window.ethereum) return 18;

    try {
      if (
        tokenAddress.toLowerCase() ===
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        return 18;
      }

      const decimalsData = "0x313ce567";

      const result = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: decimalsData,
          },
          "latest",
        ],
      });

      if (result && result !== "0x") {
        return parseInt(result, 16);
      }

      return 18;
    } catch (error) {
      console.error("Error fetching decimals:", error);
      return 18;
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
      fetchGas(CONTRACT_CONFIG.mantle.rpc),
    ]);
    return { ethereum: eth, mantle };
  },

  getBungeeTokens: async () => {
    try {
      const res = await fetch("https://trackpad.onrender.com/api/bungee/tokens");
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
          return tokens;
        }
        return MOCK_TOKENS;
      }
      return MOCK_TOKENS;
    } catch (e) {
      console.warn("Bungee tokens fetch failed:", e.message);
      return MOCK_TOKENS;
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

  checkTokenApproval: async ({
    tokenAddress,
    spenderAddress,
    amount,
    userAddress,
  }) => {
    if (!window.ethereum) throw new Error("Wallet not connected");

    try {
      if (
        tokenAddress.toLowerCase() ===
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        return { needsApproval: false, currentAllowance: "0" };
      }

      const ownerPadded = userAddress.slice(2).padStart(64, "0");
      const spenderPadded = spenderAddress.slice(2).padStart(64, "0");
      const allowanceData = "0xdd62ed3e" + ownerPadded + spenderPadded;

      const allowance = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: allowanceData,
          },
          "latest",
        ],
      });

      const currentAllowance = BigInt(allowance || "0x0");
      const requiredAmount = BigInt(amount);

      console.log("Allowance check:", {
        token: tokenAddress,
        current: currentAllowance.toString(),
        required: requiredAmount.toString(),
        needsApproval: currentAllowance < requiredAmount,
      });

      return {
        needsApproval: currentAllowance < requiredAmount,
        currentAllowance: currentAllowance.toString(),
      };
    } catch (error) {
      console.error("Error checking approval:", error);
      return { needsApproval: true, currentAllowance: "0" };
    }
  },

  approveToken: async ({ tokenAddress, spenderAddress, userAddress }) => {
    if (!window.ethereum) throw new Error("Wallet not connected");

    try {
      console.log("Approving token...", {
        tokenAddress,
        spenderAddress,
      });

      const spenderPadded = spenderAddress
        .toLowerCase()
        .replace("0x", "")
        .padStart(64, "0");

      const maxUint256 = "f".repeat(64);
      const approvalData = "0x095ea7b3" + spenderPadded + maxUint256;

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: userAddress,
            to: tokenAddress,
            data: approvalData,
            value: "0x0",
          },
        ],
      });

      console.log("Approval transaction sent:", txHash);

      console.log("Waiting for approval confirmation...");
      for (let i = 0; i < 45; i++) {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt?.blockNumber) {
          console.log(
            "✓ Approval confirmed in block:",
            parseInt(receipt.blockNumber, 16)
          );
          return { success: true, txHash };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { success: true, txHash };
    } catch (error) {
      console.error("Approval error:", error);
      if (error.code === 4001) {
        throw new Error("Approval rejected by user");
      }
      throw error;
    }
  },

  approveTokenDirect: async (txParams) => {
    if (!window.ethereum) throw new Error("Wallet not connected");

    try {
      console.log("Sending approval transaction:", txParams);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Approval transaction sent:", txHash);

      console.log("Waiting for approval confirmation...");
      for (let i = 0; i < 45; i++) {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt?.blockNumber) {
          console.log(
            "✓ Approval confirmed in block:",
            parseInt(receipt.blockNumber, 16)
          );
          return { success: true, txHash };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { success: true, txHash };
    } catch (error) {
      console.error("Approval error:", error);
      if (error.code === 4001) {
        throw new Error("Approval rejected by user");
      }
      throw error;
    }
  },

  executeSwapOnly: async ({
    fromToken,
    toToken,
    amount,
    userAddress,
    slippage = 0.5,
  }) => {
    if (!window.ethereum) throw new Error("Wallet not connected");

    const MANTLE_CHAIN_ID = 5000;
    const MANTLE_CHAIN_ID_HEX = "0x1388";

    try {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (currentChainId !== MANTLE_CHAIN_ID_HEX) {
        throw new Error("Please switch to Mantle network");
      }

      console.log("Getting fresh quote for swap...");
      const quoteParams = new URLSearchParams({
        originChainId: MANTLE_CHAIN_ID,
        destinationChainId: MANTLE_CHAIN_ID,
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: amount,
        userAddress: userAddress,
        receiverAddress: userAddress,
        slippage: slippage,
        enableManual: true,
      });

      const quoteRes = await fetch(
        `https://trackpad.onrender.com/api/bungee/quote?${quoteParams}`
      );
      if (!quoteRes.ok) throw new Error("Quote failed");

      const quote = await quoteRes.json();
      if (!quote?.success || !quote?.result) throw new Error("Invalid quote");

      const route = quote.result.autoRoute || quote.result.manualRoutes?.[0];
      if (!route) throw new Error("No route found");

      const routeId = route.quoteId || route.requestHash;
      console.log("Fresh Quote ID obtained:", routeId);

      console.log("Building transaction...");
      const buildParams = new URLSearchParams({ userAddress });
      if (route.quoteId) buildParams.append("quoteId", route.quoteId);
      else if (route.requestHash)
        buildParams.append("requestHash", route.requestHash);

      const buildRes = await fetch(
        `https://trackpad.onrender.com/api/bungee/build-tx?${buildParams}`
      );
      if (!buildRes.ok) {
        const err = await buildRes.json();
        throw new Error(err.message || "Build transaction failed");
      }

      const buildData = await buildRes.json();
      const txData =
        buildData.result?.userTxs?.[0] ||
        buildData.result?.txData ||
        buildData.result?.[0];

      if (!txData) throw new Error("No transaction data received");

      console.log("Sending swap transaction...");

      const isNative =
        fromToken.toLowerCase() ===
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      let value = "0x0";

      if (isNative && txData.value) {
        if (txData.value.startsWith("0x")) {
          value = txData.value;
        } else {
          value = "0x" + BigInt(txData.value).toString(16);
        }
      }

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: userAddress,
            to: txData.to,
            data: txData.data,
            value: value,
          },
        ],
      });

      console.log("✓ Swap successful:", txHash);

      return {
        success: true,
        txHash,
        chain: "Mantle",
        routerUsed: txData.to,
      };
    } catch (error) {
      console.error("Swap error:", error);
      throw error;
    }
  },
};

export const fetchLivePrices = async (holdings) => {
  const prices = {};
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
            console.warn(`Finnhub failed for ${symbol}`, e);
          }
        }

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
    let lookupId = null;
    if (typeof id === "number" || /^[0-9]+$/.test(String(id))) {
      lookupId = String(id);
    } else {
      const code = String(id).toUpperCase();
      if (CMC_IDS[code]) lookupId = String(CMC_IDS[code]);
      else {
        const found = Object.keys(CMC_IDS).find(
          (k) => k.toLowerCase() === String(id).toLowerCase()
        );
        if (found) lookupId = String(CMC_IDS[found]);
      }
    }

    if (lookupId) {
      try {
        const res = await fetch(
          `https://trackpad.onrender.com/api/cmc-history?id=${lookupId}&count=${days}`
        );
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("CMC backend error", e);
      }
    }
  }

  if (type === "stock" && import.meta.env.VITE_FINNHUB_API_KEY) {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 86400;

      const res = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${id}&resolution=D&from=${from}&to=${to}&token=${
          import.meta.env.VITE_FINNHUB_API_KEY
        }`
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

  console.warn("Using mock data for", id);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString(),
    price: 100 + Math.sin(i / 2) * 10 + Math.random() * 5,
  }));
};

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
      return {};
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
