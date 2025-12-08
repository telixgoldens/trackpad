import React from 'react';
import { useTheme } from '../context/ThemeContext';

const HistoricalChart = ({ data }) => {
    const { theme } = useTheme();
    if (!data || !data.length) return <div className={`h-40 flex items-center justify-center ${theme.textSecondary}`}>No Data</div>;
    const prices = data.map(d => d.price);
    const min = Math.min(...prices) * 0.99;
    const range = (Math.max(...prices) * 1.01) - min;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.price - min) / range) * 100}`).join(' ');
    const isUp = data[data.length-1].price >= data[0].price;
    return (
        <div className="w-full h-48 p-2">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polygon points={`0,100 ${points} 100,100`} fill={isUp ? 'green' : 'red'} fillOpacity="0.1" />
                <polyline points={points} fill="none" stroke={isUp ? 'green' : 'red'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};
export default HistoricalChart;