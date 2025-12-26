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
    const quotes = json.data[id].quotes;

    const data = quotes.map(q => ({
      date: new Date(q.timestamp).toLocaleDateString(),
      price: q.quote.USD.close
    }));

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "CMC fetch failed" });
  }
}
