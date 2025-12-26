import React, { useEffect, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { fetchHistoricalData } from "../utils/services";

const InteractiveChart = ({ symbol, type }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const load = async () => {
      setLoading(true);
      try {
        const history = await fetchHistoricalData(symbol, type);
        setData(history || []);
      } catch (e) {
        console.error("Chart load error", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [symbol, type]);
  
  useEffect(() => {
  if (!symbol) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/cmc-history?id=${CMC_IDS[symbol]}`);
      const latest = await res.json();

      setData(latest.slice(-30));
    } catch {}
  }, 15000); // 15s refresh

  return () => clearInterval(interval);
}, [symbol]);


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
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip />
          <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fill="url(#colorPrice)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InteractiveChart;
