import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Web3Service } from "../utils/services";

const GasFeeWidget = () => {
  const { theme } = useTheme();
  const [fees, setFees] = useState(null);
  useEffect(() => {
    const fetch = async () => setFees(await Web3Service.getGasFees());
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);
  if (!fees) return null;
  return (
    <div
      className={`flex items-center space-x-4 text-xs font-mono py-2 px-4 rounded-lg border ${theme.border} ${theme.bgSecondary} mb-4 overflow-x-auto`}
    >
      <span className="font-bold text-gray-500 uppercase tracking-wider">
        Gas:
      </span>
      <span className="text-blue-500">Base: {fees.base}</span>
      <span className="text-purple-500">ETH: {fees.ethereum}</span>
      <span className="text-yellow-500">BNB: {fees.bnb}</span>
    </div>
  );
};
export default GasFeeWidget;
