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

const BUNGEE_BASE = "https://dedicated-backend.bungee.exchange/api/v1";

const BUNGEE_HEADERS = {
  "x-api-key": process.env.BUNGEE_API_KEY,
  "affiliate": process.env.BUNGEE_AFFILIATE_ID,
  "Content-Type": "application/json",
};

// Supported chains
app.get("/api/bungee/supported-chains", async (req, res) => {
  try {
    const r = await fetch(`${BUNGEE_BASE}/supported-chains`, {
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
    const r = await fetch(`${BUNGEE_BASE}/token-lists/all`, {
      headers: BUNGEE_HEADERS,
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("Bungee tokens error:", e);
    res.status(500).json({ error: "Bungee tokens fetch failed" });
  }
});

// Quote
app.post("/api/bungee/quote", async (req, res) => {
  try {
    const r = await fetch(`${BUNGEE_BASE}/quote`, {
      method: "POST",
      headers: BUNGEE_HEADERS,
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("Bungee quote error:", e);
    res.status(500).json({ error: "Bungee quote failed" });
  }
});

// Build transaction
app.post("/api/bungee/build-tx", async (req, res) => {
  try {
    const r = await fetch(`${BUNGEE_BASE}/build-tx`, {
      method: "POST",
      headers: BUNGEE_HEADERS,
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("Bungee build tx error:", e);
    res.status(500).json({ error: "Bungee build tx failed" });
  }
});


app.listen(3001, () => console.log("Backend running on :3001"));
