import React from "react";
import { useTheme } from "../context/ThemeContext";

const MetricCard = ({ title, value, trend, isPositive }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} border ${theme.border}`}
    >
      <p
        className={`text-xs uppercase font-bold tracking-wider ${theme.textSecondary}`}
      >
        {title}
      </p>
      <div className="flex items-end justify-between mt-2">
        <p className={`text-2xl font-bold ${theme.textPrimary}`}>{value}</p>
        {trend !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              isPositive ? theme.pnlPositive : theme.pnlNegative
            }`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
};
export default MetricCard;
