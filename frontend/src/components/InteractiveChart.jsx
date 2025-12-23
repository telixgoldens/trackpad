import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const InteractiveChart = ({ symbol }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const history = await fetchHistoricalData(symbol);
            setData(history);
            setLoading(false);
        };
        if (symbol) load();
    }, [symbol]);

    if (loading) return <div className="h-48 flex items-center justify-center text-gray-500 animate-pulse font-black text-[10px]">SYNCING CHART...</div>;
    return (
        <div className="w-full h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
export default InteractiveChart;
