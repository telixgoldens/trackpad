import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";

dotenv.config();
const app = express();

app.use(cors());

app.get("/api/cmc-history", async (req, res) => {
  const { id, count = 30 } = req.query;

  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const r = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical?id=${id}&count=${count}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY
        }
      }
    );

    if (!r.ok) {
      const text = await r.text();
      console.error("CMC API responded with", r.status, text);
      return res.status(502).json({ error: "CMC API error", status: r.status, body: text });
    }

    const j = await r.json();
    const payload = j?.data;

    let quotes = null;
    if (payload == null) {
      console.error("Unexpected CMC payload", JSON.stringify(j).slice(0, 200));
      try { fs.writeFileSync("cmc_debug.json", JSON.stringify(j, null, 2)); } catch (e) {}
      return res.status(502).json({ error: "Invalid CMC payload" });
    }

    // CMC may return { data: { <id>: { quotes: [...] } } } or { data: { id: 1, quotes: [...] } }
    if (payload[id] && Array.isArray(payload[id].quotes)) {
      quotes = payload[id].quotes;
    } else if (Array.isArray(payload.quotes)) {
      quotes = payload.quotes;
    }

    if (!quotes) {
      console.error("Unexpected CMC payload structure", JSON.stringify(j).slice(0, 200));
      try { fs.writeFileSync("cmc_debug.json", JSON.stringify(j, null, 2)); } catch (e) {}
      return res.status(502).json({ error: "Invalid CMC payload" });
    }

    const data = quotes.map((q) => ({
      date: new Date(q.timestamp || q.quote?.USD?.timestamp).toLocaleDateString(),
      price: q.quote?.USD?.close ?? null,
    }));

    res.json(data);
  } catch (err) {
    console.error("CMC fetch error:", err);
    res.status(500).json({ error: "CMC fetch failed" });
  }
});

// ================================
// BUNGEE / SOCKET BACKEND ROUTES
// ================================

// CORRECTED BUNGEE BACKEND ENDPOINTS

const BUNGEE_BASE = "https://dedicated-backend.bungee.exchange";

const BUNGEE_HEADERS = {
  "x-api-key": process.env.BUNGEE_API_KEY,
  "affiliate": process.env.BUNGEE_AFFILIATE_ID,
  "Content-Type": "application/json",
};

// Supported chains
app.get("/api/bungee/supported-chains", async (req, res) => {
  try {
    const r = await fetch(`${BUNGEE_BASE}/api/v1/supported-chains`, {
      headers: BUNGEE_HEADERS,
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("Bungee chains error:", e);
    res.status(500).json({ error: "Bungee chains fetch failed" });
  }
});

// Token list
app.get("/api/bungee/tokens", async (req, res) => {
  try {
    const r = await fetch(`${BUNGEE_BASE}/api/v1/tokens/list`, {
      headers: BUNGEE_HEADERS,
    });
    const data = await r.json();
    
    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    res.json(data);
  } catch (e) {
    console.error("Bungee tokens error:", e);
    res.status(500).json({ error: "Bungee tokens fetch failed" });
  }
});

// FIX: Quote endpoint - Forward query parameters!
app.get("/api/bungee/quote", async (req, res) => {
  try {
    console.log("Quote request params:", req.query);
    
    // Build query string from frontend parameters
    const params = new URLSearchParams(req.query);
    const url = `${BUNGEE_BASE}/api/v1/bungee/quote?${params.toString()}`;
    
    console.log("Forwarding to Bungee:", url);
    
    const r = await fetch(url, {
      method: "GET",
      headers: BUNGEE_HEADERS,
    });
    
    const data = await r.json();
    
    console.log("Bungee response:", data.success ? "Success" : `Failed: ${data.message}`);
    
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    
    res.json(data);
  } catch (e) {
    console.error("Bungee quote error:", e);
    res.status(500).json({ error: "Bungee quote failed", details: e.message });
  }
});

// FIX: Build transaction - Forward query parameters!
app.get("/api/bungee/build-tx", async (req, res) => {
  try {
    console.log("Build tx request params:", req.query);
    
    // Build query string from frontend parameters
    const params = new URLSearchParams(req.query);
    const url = `${BUNGEE_BASE}/api/v1/bungee/build-tx?${params.toString()}`;
    
    console.log("Forwarding to Bungee:", url);
    
    const r = await fetch(url, {
      method: "GET",
      headers: BUNGEE_HEADERS,
    });
    
    const data = await r.json();
    
    console.log("Bungee build tx response:", data.success ? "Success" : `Failed: ${data.message}`);
    
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    
    // FIX: Don't extract Mantle tokens here, return full response
    res.json(data);
  } catch (e) {
    console.error("Bungee build tx error:", e);
    res.status(500).json({ error: "Bungee build tx failed", details: e.message });
  }
});


app.listen(3001, () => console.log("Backend running on :3001"));
