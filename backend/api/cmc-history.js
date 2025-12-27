export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing crypto id" });
  }

  try {
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical?id=${id}&count=30&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY
        }
      }
    );

    const json = await response.json();
    const payload = json?.data;

    let quotes = null;
    if (payload == null) {
      return res.status(502).json({ error: "Invalid CMC payload" });
    }

    if (payload[id] && Array.isArray(payload[id].quotes)) {
      quotes = payload[id].quotes;
    } else if (Array.isArray(payload.quotes)) {
      quotes = payload.quotes;
    }

    if (!quotes) return res.status(502).json({ error: "Invalid CMC payload" });

    const data = quotes.map((q) => ({
      date: new Date(q.timestamp || q.quote?.USD?.timestamp).toISOString(),
      price: q.quote?.USD?.close ?? null,
    }));

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "CMC fetch failed" });
  }
}
