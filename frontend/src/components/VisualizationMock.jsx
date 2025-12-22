import React from "react";
import { useTheme } from "../context/ThemeContext";

const VisualizationMock = ({ metrics }) => {
  const { theme, isDarkMode } = useTheme();
  const cryptoColor = isDarkMode ? "#fde047" : "#10b981";
  const stockColor = isDarkMode ? "#38bdf8" : "#3b82f6";

  return (
    <div
      className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} h-full flex flex-col items-center justify-center border ${theme.border}`}
    >
      <h2 className={`text-xl font-bold mb-4 ${theme.textPrimary}`}>
        Holdings Distribution
      </h2>
      <svg
        width="150"
        height="150"
        viewBox="0 0 42 42"
        className="ring-4 ring-gray-600/50 rounded-full"
      >
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke={cryptoColor}
          strokeWidth="4"
          strokeDasharray={`${metrics.cryptoPercent} ${
            100 - metrics.cryptoPercent
          }`}
          strokeDashoffset="25"
          className="transition-all duration-500"
        />
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke={stockColor}
          strokeWidth="4"
          strokeDasharray={`${metrics.stockPercent} ${
            100 - metrics.stockPercent
          }`}
          strokeDashoffset={`${25 - (100 - metrics.stockPercent)}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="mt-4 space-y-2 w-full max-w-xs">
        <div
          className={`flex justify-between items-center text-sm ${theme.textSecondary}`}
        >
          <span className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: cryptoColor }}
            ></span>
            Crypto
          </span>
          <span className={`font-semibold ${theme.textPrimary}`}>
            {metrics.cryptoPercent.toFixed(1)}%
          </span>
        </div>
        <div
          className={`flex justify-between items-center text-sm ${theme.textSecondary}`}
        >
          <span className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: stockColor }}
            ></span>
            Stocks
          </span>
          <span className={`font-semibold ${theme.textPrimary}`}>
            {metrics.stockPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
export default VisualizationMock;
