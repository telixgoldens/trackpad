import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import GasFeeWidget from "../components/GasFeeWidget";
import MetricCard from "../components/MetricCard";
import VisualizationMock from "../components/VisualizationMock";
import AddHoldingForm from "../components/AddHoldingForm";
import InteractiveChart from "../components/InteractiveChart";

import { MOCK_HOLDINGS, DEFAULT_AI_RESPONSE } from "../utils/constants";
import { Web3Service, fetchLivePrices, AIService } from "../utils/services";

const Dashboard = () => {
  const { theme } = useTheme();
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [portfolio, setPortfolio] = useState(MOCK_HOLDINGS);
  const [watchlist, setWatchlist] = useState([]);
  const [bungeeTokens, setBungeeTokens] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [dailyRecap, setDailyRecap] = useState("Loading AI Market Recap...");
  const [aiAnalysis, setAiAnalysis] = useState(DEFAULT_AI_RESPONSE);
  const [swapAmount, setSwapAmount] = useState("");

  useEffect(() => {
    if (!selectedAsset && portfolio.length > 0) setSelectedAsset(portfolio[0]);
  }, [portfolio]);

  // Load Bungee Tokens
  useEffect(() => {
    Web3Service.getBungeeTokens().then(setBungeeTokens);
  }, []);

  // Fetch Activity Logic
  useEffect(() => {
    const fetchAct = async () => {
      if (connected && address) {
        setIsActivityLoading(true);
        const realAct = await Web3Service.getWalletActivity(address);
        setActivity(realAct);
        setIsActivityLoading(false);
      } else {
        // High-fidelity Mock data for disconnected state
        setActivity([
          {
            hash: "0x12...34",
            timestamp: Date.now() - 3600000,
            method: "Swap",
            value: "1.25",
            chain: "Base",
            isMock: true,
          },
          {
            hash: "0x56...78",
            timestamp: Date.now() - 86400000,
            method: "Transfer",
            value: "500.00",
            chain: "Mantle",
            isMock: true,
          },
          {
            hash: "0x90...ab",
            timestamp: Date.now() - 172800000,
            method: "Bridge",
            value: "0.05",
            chain: "Ethereum",
            isMock: true,
          },
        ]);
      }
    };
    if (view === "activity") fetchAct();
  }, [view, walletConnected, walletAddress]);

  // Price Polling
  useEffect(() => {
    const update = async () => {
      const all = [...portfolio, ...watchlist];
      const live = await fetchLivePrices(all);
      if (Object.keys(live).length > 0) {
        setPortfolio((prev) =>
          prev.map((p) => {
            const k = p.type === "crypto" ? p.apiId : p.symbol;
            return live[k]
              ? { ...p, price: live[k].price, change: live[k].change }
              : p;
          })
        );
        setWatchlist((prev) =>
          prev.map((w) => {
            const k = w.type === "crypto" ? w.apiId : w.symbol;
            const d = live[k] ? { ...w, price: live[k].price } : w;
            if (d.target && d.price >= parseFloat(d.target))
              setModal(`TARGET REACHED: ${d.symbol} is at $${d.price}`);
            return d;
          })
        );
      }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [portfolio.length, watchlist.length]);

  useEffect(() => {
    if (view === "recap" && dailyRecap.startsWith("AI is"))
      AIService.fetchDailyRecap().then(setDailyRecap);
  }, [view]);

  const handleConnectWallet = async () => {
    try {
      const { address } = await Web3Service.connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
      setModalContent(
        <div className="p-4 text-center">
          <h3 className="text-xl font-bold mb-2">Connected</h3>
          <p>{address}</p>
        </div>
      );
    } catch (e) {
      setModalContent(
        <div className="p-4 text-center">
          <h3 className="text-xl font-bold mb-2 text-red-500">Error</h3>
          <p>{e.message}</p>
        </div>
      );
    }
  };

  const handleSwap = async () => {
    if (!walletConnected)
      return setModalContent(<p className="p-4">Connect wallet first.</p>);
    if (!swapAmount || parseFloat(swapAmount) <= 0)
      return setModalContent("Enter a valid amount.");
    setModalContent(<p className="p-4">Initiating Swap...</p>);
    try {
      const receipt = await Web3Service.executeSwap(
        walletAddress,
        swapAmount,
        "mantle"
      );
      setModalContent(
        <div className="p-4">
          <h3 className="text-xl font-bold text-green-500">Success</h3>
          <p>TX: {receipt.txHash}</p>
          <p>Fee: {receipt.feePaid}</p>
        </div>
      );
    } catch (e) {
      setModalContent(<p className="p-4">Swap Failed: {e.message}</p>);
    }
  };

  const handleGenerateCIOReport = async () => {
    setModalContent(
      <div className="flex flex-col items-center justify-center p-8">
        <svg
          className="w-10 h-10 mb-4 text-blue-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p>The AI Chief Investment Officer is analyzing your portfolio...</p>
      </div>
    );
    const cleanPortfolio = portfolio.map((p) => ({
      symbol: p.symbol,
      qty: p.quantity,
      value: p.quantity * p.price,
    }));
    const strategy = await AIService.fetchPortfolioStrategy(cleanPortfolio);
    setModalContent(
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-700">
          <h3 className="text-2xl font-extrabold text-blue-500">CIO Report</h3>
          <div className="text-right">
            <p className="text-xs text-gray-400">Risk Score</p>
            <p
              className={`text-2xl font-bold ${
                strategy.riskScore > 70 ? "text-red-500" : "text-green-500"
              }`}
            >
              {strategy.riskScore}/100
            </p>
          </div>
        </div>
        <div className="p-3 rounded bg-gray-800/50">
          <p className="text-sm font-bold text-gray-400 uppercase">
            Health Check
          </p>
          <p className="text-lg text-white">{strategy.healthCheck}</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-gray-400 uppercase">
            Action Plan
          </p>
          <ul className="pl-5 space-y-1 list-disc text-white">
            {strategy.actionPlan.map((action, i) => (
              <li key={i} className="text-sm">
                {action}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-2 mt-4 text-center border-t border-gray-700">
          <p className="text-xs italic text-gray-500">Verdict</p>
          <p className="text-xl font-bold text-white">{strategy.verdict}</p>
        </div>
      </div>
    );
  };

  const metrics = useMemo(() => {
    const total = portfolio.reduce(
      (sum, item) => sum + item.quantity * (item.price || 0),
      0
    );
    const cost = portfolio.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );
    const pnl = total - cost;
    const crypt = portfolio
      .filter((i) => i.type === "crypto")
      .reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
    // FIX: Ensuring metrics is never undefined for .toLocaleString
    return {
      total: total || 0,
      pnl: pnl || 0,
      pnlPercent: cost > 0 ? (pnl / cost) * 100 : 0,
      cryptoPercent: total > 0 ? (crypt / total) * 100 : 0,
      stockPercent: total > 0 ? (1 - crypt / total) * 100 : 0,
    };
  }, [portfolio]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Net Worth"
            value={`$${metrics.total.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`}
            trend={metrics.pnlPercent}
            isPositive={metrics.pnl >= 0}
          />
          <MetricCard
            title="Unrealized P&L"
            value={`$${metrics.pnl.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`}
            isPositive={metrics.pnl >= 0}
          />
          <MetricCard title="Tracked Assets" value={portfolio.length} />
        </div>
        <VisualizationMock metrics={metrics} />
      </div>
      <div
        className={`${theme.bgSecondary} p-6 rounded-3xl border ${theme.border}`}
      >
        <h2 className="text-sm font-black uppercase text-gray-500 tracking-widest mb-6">
          Holdings Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-bold">
            <thead className="text-gray-500 border-b border-white/5 uppercase">
              <tr>
                <th className="pb-3 px-2">Ticker</th>
                <th className="pb-3 px-2 text-right">Qty</th>
                <th className="pb-3 px-2 text-right">Price</th>
                <th className="pb-3 px-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((h) => (
                <tr
                  key={h.id}
                  onClick={() => setSelectedAsset(h)}
                  className="hover:bg-white/5 cursor-pointer"
                >
                  <td className="py-4 px-2 font-black italic">{h.symbol}</td>
                  <td className="py-4 px-2 text-right text-gray-400">
                    {h.quantity}
                  </td>
                  <td className="py-4 px-2 text-right font-black text-white">
                    ${h.price?.toLocaleString() || "---"}
                  </td>
                  <td className="py-4 px-2 text-right text-blue-400 font-black">
                    ${(h.quantity * (h.price || 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 border-t border-dashed border-gray-800 pt-8">
          <AddHoldingForm onAdd={(h) => setPortfolio([...portfolio, h])} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`${theme.bgSecondary} p-8 rounded-3xl border ${theme.border}`}
        >
          <h2 className="text-xl font-black text-white mb-2 italic uppercase">
            {selectedAsset?.name} Matrix
          </h2>
          <InteractiveChart
            symbol={
              selectedAsset?.type === "crypto"
                ? selectedAsset?.apiId
                : selectedAsset?.symbol
            }
            type={selectedAsset?.type}
          />
        </div>
        <div
          className={`${theme.bgSecondary} p-8 rounded-3xl border ${theme.border} flex flex-col`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-white italic underline underline-offset-8 decoration-blue-500">
              AI Intelligence
            </h2>
            <button
              onClick={() =>
                AIService.fetchAssetAnalysis(selectedAsset?.name).then(
                  setAiAnalysis
                )
              }
              className="text-[10px] font-black bg-white text-black px-6 py-2 rounded-full uppercase hover:bg-yellow-500 transition"
            >
              Update Analysis
            </button>
          </div>
          <div className="space-y-4">
            <div className="border-l-2 border-white/10 pl-4 py-1">
              <p className="text-[9px] uppercase font-black text-gray-500 mb-1">
                Execution Venue
              </p>
              <p className="text-xs text-white font-medium">
                {aiAnalysis.tradingVenue}
              </p>
            </div>
            <div className="border-l-2 border-white/10 pl-4 py-1">
              <p className="text-[9px] uppercase font-black text-gray-500 mb-1">
                Market Sentiment
              </p>
              <p className="text-xs text-white font-medium">
                {aiAnalysis.marketNews}
              </p>
            </div>
            <div className="border-l-2 border-white/10 pl-4 py-1">
              <p className="text-[9px] uppercase font-black text-gray-500 mb-1">
                Risk Profile
              </p>
              <p className="text-xs text-white font-medium">
                {aiAnalysis.riskAssessment}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWatchlist = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
        Watchlist & Alerts
      </h2>
      <div
        className={`${theme.bgSecondary} p-6 rounded-xl border ${theme.border}`}
      >
        {watchlist.map((w) => (
          <div
            key={w.id}
            className={`flex justify-between items-center p-3 mb-2 rounded ${theme.bgPrimary}`}
          >
            <span className={`font-bold ${theme.textPrimary}`}>{w.symbol}</span>
            <span className={theme.textPrimary}>
              ${w.price?.toLocaleString() || "---"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecap = () => (
    <div className="max-w-3xl mx-auto space-y-6 pt-10">
      <div
        className={`${theme.bgSecondary} p-12 rounded-[60px] shadow-2xl border ${theme.border}`}
      >
        <div className="flex items-center mb-8">
          <span className="mr-5 text-5xl">☕</span>
          <div>
            <h2
              className={`text-4xl font-black italic tracking-tighter text-white uppercase`}
            >
              Daily Market Briefing
            </h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
              {new Date().toLocaleDateString()} • Neural Summary
            </p>
          </div>
        </div>
        <div className="text-gray-300 leading-loose text-lg font-medium space-y-6">
          {dailyRecap.split("\n").map((line, i) => (
            <p
              key={i}
              className={`${
                line.startsWith("**")
                  ? "font-black text-white text-xl uppercase tracking-tighter italic border-l-4 border-yellow-500 pl-4 py-1 mt-10 mb-4"
                  : "mb-4"
              }`}
            >
              {line.replace(/\*\*/g, "")}
            </p>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSwap = () => (
    <div className="max-w-xl mx-auto space-y-6 pt-10">
      <GasFeeWidget />
      <div
        className={`${theme.bgSecondary} p-10 rounded-[50px] border ${theme.border} shadow-2xl`}
      >
        <h2 className="text-4xl font-black italic text-white mb-10 tracking-tighter">
          SWAP & BRIDGE
        </h2>
        {!walletConnected ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-8 font-black uppercase text-xs tracking-widest">
              Connect Wallet to Unlock Liquidity
            </p>
            <button
              onClick={handleConnectWallet}
              className="px-14 py-6 bg-white text-black font-black rounded-3xl hover:bg-yellow-500 transition shadow-[0_20px_50px_rgba(255,255,255,0.1)] uppercase"
            >
              Initialize Access
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-black/40 p-6 rounded-[30px] border border-white/5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">
                From Asset
              </label>
              <div className="flex items-center">
                <select className="bg-transparent text-xl font-black text-white focus:outline-none w-full">
                  <optgroup label="Real-Time Wallet">
                    <option>MNT (742.50)</option>
                    <option>USDC (2,400.00)</option>
                  </optgroup>
                  <optgroup label="Bungee Supported Networks">
                    {bungeeTokens.slice(0, 30).map((t) => (
                      <option key={t.address}>{t.symbol}</option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="number"
                  placeholder="0.0"
                  className="bg-transparent text-right text-3xl font-black text-white w-full focus:outline-none"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-center -my-5 relative z-10">
              <div className="bg-yellow-500 p-4 rounded-full text-black shadow-xl">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-black/40 p-6 rounded-[30px] border border-white/5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">
                To Asset
              </label>
              <div className="flex items-center">
                <select className="bg-transparent text-xl font-black text-white focus:outline-none w-full">
                  {bungeeTokens.slice(0, 50).map((t) => (
                    <option key={t.address}>
                      {t.symbol} ({t.name})
                    </option>
                  ))}
                </select>
                <p className="text-right text-3xl font-black text-gray-700 w-full">
                  0.00
                </p>
              </div>
            </div>
            <button
              onClick={handleSwap}
              className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl text-xl hover:scale-[1.02] transition shadow-lg shadow-blue-600/30 uppercase italic tracking-tighter"
            >
              Execute Order
            </button>
            <p className="text-center text-[10px] font-black text-gray-600 uppercase tracking-widest mt-4">
              Routed via Bungee • 0.1% Trackpad Fee
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="max-w-3xl mx-auto space-y-6 pt-10">
      <div
        className={`${theme.bgSecondary} p-10 rounded-[50px] border ${theme.border}`}
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase underline decoration-blue-500 decoration-8 underline-offset-8">
            On-Chain Ledger
          </h2>
          {walletConnected && (
            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-500/20 animate-pulse">
              Syncing Blocks
            </span>
          )}
        </div>
        {isActivityLoading ? (
          <div className="py-24 text-center text-gray-600 font-black uppercase text-xs tracking-widest animate-pulse">
            Decrypting Wallet Streams...
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((tx, idx) => (
              <div
                key={tx.hash || idx}
                className="p-6 rounded-[32px] bg-black/50 border border-white/5 flex items-center justify-between hover:bg-black/70 transition group cursor-default"
              >
                <div className="flex items-center space-x-6">
                  <div
                    className={`p-4 rounded-2xl ${
                      tx.isError
                        ? "bg-red-500/10 text-red-500"
                        : "bg-blue-500/10 text-blue-400"
                    } border border-white/5`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d={
                          tx.method === "Swap"
                            ? "M8 7h12m0 0l-4-4m4 4l-4 4"
                            : "M7 16V4m0 0L3 8m4-4l4 4"
                        }
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-white text-lg tracking-tighter uppercase italic">
                      {tx.method}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                      {tx.chain} •{" "}
                      {new Date(tx.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-xl tracking-tighter ${
                      tx.isError ? "text-red-500" : "text-white"
                    }`}
                  >
                    {tx.value}{" "}
                    <span className="text-[10px] text-gray-600 font-black">
                      MNT
                    </span>
                  </p>
                  <a
                    href={`https://mantlescan.xyz/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest group-hover:underline opacity-0 group-hover:opacity-100 transition-all"
                  >
                    View Record &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="max-w-3xl mx-auto space-y-8 pt-10">
      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">
          REPORTS
        </h2>
        <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className={`${theme.bgSecondary} p-10 rounded-[50px] border ${theme.border} cursor-pointer hover:scale-[1.03] transition shadow-xl group`}
          onClick={handleGenerateCIOReport}
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/30 group-hover:rotate-12 transition-transform">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">
            CIO Strategy
          </h3>
          <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-wider">
            Deep portfolio risk matrix and rebalancing engine.
          </p>
        </div>
        <div
          className={`${theme.bgSecondary} p-10 rounded-[50px] border ${theme.border} opacity-40 grayscale cursor-not-allowed`}
        >
          <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mb-8">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-500 mb-3 uppercase tracking-tighter italic">
            Tax Engine
          </h3>
          <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
            Historical cost-basis exports (Q1 2026).
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-screen">
      {modalContent && (
        <Modal onClose={() => setModalContent(null)}>{modalContent}</Modal>
      )}
      <Sidebar
        currentView={view}
        setView={setView}
        walletConnected={walletConnected}
        connectWallet={handleConnectWallet}
        isSidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 p-4 overflow-y-auto lg:ml-64 md:p-8">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded ${theme.textPrimary}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
          <span className={`font-bold ${theme.accentText}`}>Trackpad</span>
          <div className="w-8"></div>
        </div>
        {view === "dashboard" && renderDashboard()}
        {view === "watchlist" && renderWatchlist()}
        {view === "recap" && renderRecap()}
        {view === "swap" && renderSwap()}
        {view === "activity" && renderActivity()}
        {view === "reports" && renderReports()}
      </main>
    </div>
  );
};

export default Dashboard;
