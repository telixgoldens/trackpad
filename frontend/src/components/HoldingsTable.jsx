import React from "react";
import { useTheme } from "../context/ThemeContext";

const HoldingsTable = ({ holdings, onSelect, onDelete }) => {
  const { theme } = useTheme();
  const detailedHoldings = holdings.map((h) => {
    const currentValue = h.quantity * h.price;
    const costBasis = h.quantity * h.purchasePrice;
    const totalPL = currentValue - costBasis;
    return { ...h, currentValue, totalPL };
  });

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${theme.border}`}>
        <thead className={theme.bgPrimary}>
          <tr>
            {[
              "Asset",
              "Type",
              "Qty",
              "Cost/Unit",
              "Live Price",
              "Value",
              "P&L",
              "Actions",
            ].map((header) => (
              <th
                key={header}
                className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textSecondary}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${theme.border} ${theme.bgSecondary}`}>
          {detailedHoldings.map((asset) => (
            <tr
              key={asset.id}
              className={`cursor-pointer transition duration-150 hover:${theme.bgPrimary}`}
              onClick={() => onSelect(asset)}
            >
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm font-medium ${theme.textPrimary}`}
              >
                {asset.symbol}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm ${theme.textSecondary}`}
              >
                {asset.type}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm ${theme.textPrimary}`}
              >
                {asset.quantity.toFixed(4)}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm ${theme.textPrimary}`}
              >
                ${asset.purchasePrice.toFixed(2)}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm font-semibold ${theme.textPrimary}`}
              >
                ${asset.price.toLocaleString()}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm font-bold ${theme.accentText}`}
              >
                $
                {asset.currentValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td
                className={`px-3 py-3 whitespace-nowrap text-sm font-medium ${
                  asset.totalPL >= 0
                    ? theme.pnlPositive.split(" ")[0]
                    : theme.pnlNegative.split(" ")[0]
                }`}
              >
                $
                {asset.totalPL.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(asset.id);
                  }}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {holdings.length === 0 && (
        <div
          className={`text-center py-6 ${theme.textSecondary} italic border-t ${theme.border}`}
        >
          No holdings in your portfolio.
        </div>
      )}
    </div>
  );
};
export default HoldingsTable;
