import React, { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { CMC_IDS } from "../utils/cryptoMap";

const InteractiveChart = ({ symbol, type }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("1M");

  useEffect(() => {
    if (!symbol) return;

    let stopped = false;

    console.log("InteractiveChart mounted", { symbol, type });
    console.log("Chart symbol:", symbol);

    const fetchData = async () => {
      try {
        const cmcId = CMC_IDS[symbol];
        console.log("CMC_IDS mapping for", symbol, "=", cmcId);
        if (!cmcId) {
          console.warn("No CMC id for symbol", symbol);
          return;
        }
        const url = `/api/cmc-history?id=${cmcId}&count=${{
          '1D': 1,
          '7D': 7,
          '1M': 30,
          '3M': 90,
          '1Y': 365
        }[range] || 30}`;
        console.log("Fetching:", url);
        const res = await fetch(url);
        if (!res.ok) {
          console.warn("CMC backend returned non-ok", res.status);
          return;
        }
        const data = await res.json();
        console.log("CMC chart data:", data);
        if (!stopped && Array.isArray(data)) {
          setData(data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [symbol, range]);
useEffect(() => {
    // Debug: expose chart state to console for UX troubleshooting
    console.debug("InteractiveChart state:", { symbol, loading, data });
  }, [symbol, loading, data]);


  const TIMEFRAMES = ["1D", "7D", "1M", "3M", "1Y"];

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse font-black text-[10px]">
        SYNCING CHART...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 font-black text-[10px]">
        NO DATA AVAILABLE
      </div>
    );
  }

  return (
    <div className="w-full h-48 mt-4">
      <div className="flex gap-2 text-[10px] font-bold text-gray-400">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setRange(tf)}
            className={`px-2 py-1 rounded-md ${
              range === tf ? "bg-blue-500 text-white" : "hover:text-white"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              // Accepts DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
              if (typeof v === 'string' && v.includes('/')) {
                const [d, m, y] = v.split('/');
                if (d.length === 2 && m.length === 2 && y.length === 4) {
                  return `${m}/${d}/${y}`;
                }
              }
              return new Date(v).toLocaleDateString();
            }}
          />

          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InteractiveChart;
