import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Web3Service } from "../utils/services";

const GasFeeWidget = () => {
  const { theme } = useTheme();
  const [fees, setFees] = useState({
    ethereum: "...",
    base: "...",
    mantle: "...",
  });
  useEffect(() => {
    const update = async () => setFees(await Web3Service.getLiveGasFees());
    update();
    const i = setInterval(update, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className={`flex space-x-4 bg-white/5 p-3 rounded-2xl border border-white/5 text-[10px] font-black ${theme.border} ${theme.bgSecondary}uppercase overflow-x-auto`}
    >
      <span className="text-gray-500">Live Gas (Gwei):</span>
      <span className="text-purple-400">ETH: {fees.ethereum}</span>
      <span className="text-emerald-400">Mantle: {fees.mantle}</span>
    </div>
  );
};
export default GasFeeWidget;
