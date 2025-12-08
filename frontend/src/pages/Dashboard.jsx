import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import GasFeeWidget from '../components/GasFeeWidget';
import MetricCard from '../components/MetricCard';
import VisualizationMock from '../components/VisualizationMock';
import HoldingsTable from '../components/HoldingsTable';
import AddHoldingForm from '../components/AddHoldingForm';
import HistoricalChart from '../components/HistoricalChart';
import AIAnalysisSection from '../components/AIAnalysisSection';

import { MOCK_HOLDINGS, DEFAULT_AI_RESPONSE } from '../utils/constants';
import { Web3Service, fetchLivePrices, AIService, generateMockHistoricalData } from '../utils/services';

const Dashboard = () => {
    const { theme } = useTheme();
    const [view, setView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Data State
    const [portfolio, setPortfolio] = useState(MOCK_HOLDINGS);
    const [watchlist, setWatchlist] = useState([]);
    
    // UI State
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [walletConnected, setWalletConnected] = useState(false);
    const [modalContent, setModalContent] = useState(null); 
    const [dailyRecap, setDailyRecap] = useState("Loading AI Market Recap...");
    const [aiAnalysis, setAiAnalysis] = useState(DEFAULT_AI_RESPONSE);
    
    // Swap Form State
    const [swapAmount, setSwapAmount] = useState('');
    const [swapTokenIn, setSwapTokenIn] = useState('');
    const [swapTokenOut, setSwapTokenOut] = useState('');

    // Init Logic
    useEffect(() => {
        setWatchlist([{ id: 'w1', symbol: 'SOL', apiId: 'solana', price: 0 }]);
    }, []);

    // Price Polling
    useEffect(() => {
        const interval = setInterval(async () => {
            const allAssets = [...portfolio, ...watchlist];
            const prices = await fetchLivePrices(allAssets);
            if (Object.keys(prices).length > 0) {
                setPortfolio(prev => prev.map(p => p.apiId && prices[p.apiId] ? { ...p, price: prices[p.apiId].usd } : p));
                setWatchlist(prev => prev.map(w => w.apiId && prices[w.apiId] ? { ...w, price: prices[w.apiId].usd } : w));
            }
        }, 30000); 
        return () => clearInterval(interval);
    }, [portfolio, watchlist]);

    // Handlers
    const handleConnectWallet = async () => {
        try {
            const { address } = await Web3Service.connectWallet();
            setWalletAddress(address);
            setWalletConnected(true);
            setModalContent(<div className="p-4 text-center"><h3 className="text-xl font-bold mb-2">Connected</h3><p>{address}</p></div>);
        } catch (e) {
            setModalContent(<div className="p-4 text-center"><h3 className="text-xl font-bold mb-2 text-red-500">Error</h3><p>{e.message}</p></div>);
        }
    };

    const handleSwap = async () => {
        if (!walletConnected) return setModalContent(<p className="p-4">Connect wallet first.</p>);
        setModalContent(<p className="p-4">Initiating Swap...</p>);
        try {
            const receipt = await Web3Service.executeSwap(walletAddress, swapTokenIn, swapTokenOut, swapAmount, 'base');
            setModalContent(<div className="p-4"><h3 className="text-xl font-bold text-green-500">Success</h3><p>TX: {receipt.txHash}</p><p>Fee: {receipt.feePaid}</p></div>);
        } catch (e) {
            setModalContent(<p className="p-4">Swap Failed: {e.message}</p>);
        }
    };

    const handleAddHolding = (holding) => setPortfolio([...portfolio, holding]);
    const handleDeleteHolding = (id) => setPortfolio(portfolio.filter(h => h.id !== id));

    const handleGenerateCIOReport = async () => {
        setModalContent(<div className="flex flex-col items-center justify-center p-8"><svg className="w-10 h-10 mb-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p>The AI Chief Investment Officer is analyzing your portfolio...</p></div>);
        const cleanPortfolio = portfolio.map(p => ({ symbol: p.symbol, qty: p.quantity, value: p.quantity * p.price }));
        const strategy = await AIService.fetchPortfolioStrategy(cleanPortfolio);
        setModalContent(
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-700"><h3 className="text-2xl font-extrabold text-blue-500">CIO Report</h3><div className="text-right"><p className="text-xs text-gray-400">Risk Score</p><p className={`text-2xl font-bold ${strategy.riskScore > 70 ? 'text-red-500' : 'text-green-500'}`}>{strategy.riskScore}/100</p></div></div>
                <div className="p-3 rounded bg-gray-800/50"><p className="text-sm font-bold text-gray-400 uppercase">Health Check</p><p className="text-lg text-white">{strategy.healthCheck}</p></div>
                <div><p className="mb-2 text-sm font-bold text-gray-400 uppercase">Action Plan</p><ul className="pl-5 space-y-1 list-disc text-white">{strategy.actionPlan.map((action, i) => (<li key={i} className="text-sm">{action}</li>))}</ul></div>
                <div className="pt-2 mt-4 text-center border-t border-gray-700"><p className="text-xs italic text-gray-500">Verdict</p><p className="text-xl font-bold text-white">{strategy.verdict}</p></div>
            </div>
        );
    };

    useEffect(() => {
        if (view === 'recap' && dailyRecap.startsWith("Loading")) AIService.fetchDailyRecap().then(setDailyRecap);
    }, [view]);

    // Portfolio Calculations
    const portfolioMetrics = useMemo(() => {
        const totalValue = portfolio.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalPnl = portfolio.reduce((sum, item) => sum + ((item.quantity * item.price) - (item.quantity * item.purchasePrice)), 0);
        const cryptoValue = portfolio.filter(i => i.type === 'crypto').reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const stockValue = portfolio.filter(i => i.type === 'stock').reduce((sum, item) => sum + (item.quantity * item.price), 0);
        return {
            totalValue: totalValue.toFixed(2),
            totalPnl: totalPnl.toFixed(2),
            cryptoPercent: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0,
            stockPercent: totalValue > 0 ? (stockValue / totalValue) * 100 : 0,
        };
    }, [portfolio]);

    const chartData = useMemo(() => generateMockHistoricalData(selectedAsset?.symbol || 'UNK', selectedAsset?.price), [selectedAsset]);

    // --- VIEW RENDERERS ---
    const renderDashboard = () => (
        <div className="space-y-6">
            <GasFeeWidget />
            {/* Top Row: Metrics & Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <MetricCard title="Total Portfolio Value" value={`$${parseFloat(portfolioMetrics.totalValue).toLocaleString()}`} trend={2.4} isPositive={true} />
                    <MetricCard title="Total P&L" value={`$${parseFloat(portfolioMetrics.totalPnl).toLocaleString()}`} trend={5.8} isPositive={parseFloat(portfolioMetrics.totalPnl) >= 0} />
                    <MetricCard title="Total Holdings" value={portfolio.length} trend={0} isPositive={true} />
                </div>
                <VisualizationMock metrics={portfolioMetrics} />
            </div>
            
            {/* Passive Tracking / Wallet Input */}
            <div className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} border ${theme.border}`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.textPrimary} border-b pb-2 ${theme.border}`}>Wallet Status / Passive Tracking</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow w-full md:w-auto">
                        <label className={`block text-sm font-medium mb-1 ${theme.textSecondary}`}>Enter Wallet Address (DeBank Style)</label>
                        <input type="text" placeholder="0x..." value={walletAddress || ''} onChange={(e) => setWalletAddress(e.target.value)} className={`w-full p-3 border ${theme.border} rounded-lg ${theme.bgPrimary} ${theme.textPrimary}`} disabled={walletConnected} />
                        <p className={`text-xs mt-1 ${theme.textSecondary}`}>Status: {walletConnected ? 'Active Connection' : walletAddress ? 'Passive Tracking' : 'Disconnected'}</p>
                    </div>
                    <button onClick={handleConnectWallet} className={`w-full md:w-auto px-6 py-3 rounded-lg font-semibold shadow-md ${walletConnected ? 'bg-emerald-500 text-white' : `${theme.accentBg} text-white`}`}>{walletConnected ? 'Connected' : 'Connect Wallet'}</button>
                </div>
            </div>

            {/* Holdings & Add Form */}
            <div className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} border ${theme.border}`}>
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Portfolio Holdings</h2>
                    <button onClick={handleGenerateCIOReport} className="px-3 py-1 text-xs font-bold text-white bg-purple-600 rounded shadow hover:bg-purple-700">✨ CIO Report</button>
                </div>
                <HoldingsTable holdings={portfolio} onSelect={setSelectedAsset} onDelete={handleDeleteHolding} />
                <AddHoldingForm onAdd={handleAddHolding} />
            </div>

            {/* Bottom Row: Chart/Swap & AI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} space-y-6 border ${theme.border}`}>
                    <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4 border-b pb-2 ${theme.border}`}>{selectedAsset ? `${selectedAsset.name} Analysis` : 'Select Asset'}</h2>
                    <div className={`w-full h-48 rounded-lg ${theme.bgPrimary} border ${theme.border}`}><HistoricalChart data={chartData} /></div>
                    <div className={`pt-4 border-t ${theme.border}`}>
                        <h3 className={`text-xl font-semibold mb-3 ${theme.textPrimary}`}>Token Swap</h3>
                        <div className="grid gap-2 mb-3">
                            <input type="text" placeholder="Token In" value={swapTokenIn} onChange={e => setSwapTokenIn(e.target.value)} className={`w-full p-2 border rounded ${theme.bgPrimary} ${theme.textPrimary}`} />
                            <input type="text" placeholder="Token Out" value={swapTokenOut} onChange={e => setSwapTokenOut(e.target.value)} className={`w-full p-2 border rounded ${theme.bgPrimary} ${theme.textPrimary}`} />
                            <input type="number" placeholder="Amount" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} className={`w-full p-2 border rounded ${theme.bgPrimary} ${theme.textPrimary}`} />
                        </div>
                        <button onClick={handleSwap} className={`w-full py-3 font-bold text-white rounded-lg shadow-xl ${walletConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-500'}`}>Execute Swap (0.1% Fee)</button>
                    </div>
                </div>

                <div className={`${theme.bgSecondary} p-6 rounded-xl ${theme.shadow} border ${theme.border}`}>
                    <div className={`flex justify-between items-center mb-4 border-b pb-2 ${theme.border}`}>
                        <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>AI Intelligence</h2>
                        <button onClick={() => AIService.fetchAssetAnalysis(selectedAsset?.name).then(res => setAiAnalysis(res))} disabled={!selectedAsset} className={`px-4 py-2 font-semibold text-white rounded-lg shadow-md ${theme.accentBg}`}>Analyze Asset</button>
                    </div>
                    <div className="space-y-6">
                        <AIAnalysisSection title="Trading Venue" content={aiAnalysis.tradingVenue} iconColor={theme.accentText} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>} />
                        <AIAnalysisSection title="Market News" content={aiAnalysis.marketNews} iconColor="text-green-500" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 22h16c.89 0 1.34-.89.71-1.54L12 2.5 3.29 20.46c-.63.65-.18 1.54.71 1.54z"></path></svg>} />
                        <AIAnalysisSection title="Risk Assessment" content={aiAnalysis.riskAssessment} iconColor="text-red-500" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWatchlist = () => (
        <div className="space-y-6"><h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Watchlist & Alerts</h2><div className={`${theme.bgSecondary} p-6 rounded-xl border ${theme.border}`}>{watchlist.map(w => (<div key={w.id} className={`flex justify-between items-center p-3 mb-2 rounded ${theme.bgPrimary}`}><span className={`font-bold ${theme.textPrimary}`}>{w.symbol}</span><span className={theme.textPrimary}>${w.price?.toLocaleString() || '---'}</span></div>))}</div></div>
    );

    const renderRecap = () => (
        <div className="max-w-3xl mx-auto space-y-6"><div className={`p-8 rounded-2xl shadow-2xl border ${theme.border} ${theme.bgSecondary}`}><div className="flex items-center mb-6"><span className="mr-4 text-4xl">☕</span><div><h2 className={`text-3xl font-extrabold ${theme.textPrimary}`}>Daily Market Recap</h2><p className={theme.textSecondary}>{new Date().toLocaleDateString()} • AI Generated</p></div></div><div className={`prose lg:prose-xl ${theme.textPrimary}`}>{dailyRecap.split('\n').map((line, i) => (<p key={i} className={`mb-4 leading-relaxed ${line.startsWith('**') ? 'font-bold text-lg' : ''}`}>{line.replace(/\*\*/g, '')}</p>))}</div></div></div>
    );

    const renderSwap = () => (
        <div className="max-w-2xl mx-auto mt-10">
            <div className={`${theme.bgSecondary} p-8 rounded-2xl shadow-xl border ${theme.border}`}>
                <h2 className={`text-3xl font-extrabold mb-6 ${theme.textPrimary}`}>Swap & Bridge</h2>
                <GasFeeWidget />
                <div className="space-y-4 mt-6">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${theme.textSecondary}`}>From (Address)</label>
                        <input type="text" className={`w-full p-4 rounded-lg border ${theme.border} ${theme.bgPrimary} ${theme.textPrimary}`} placeholder="0x..." value={swapTokenIn} onChange={e => setSwapTokenIn(e.target.value)} />
                    </div>
                    <div className="flex justify-center"><svg className={`w-8 h-8 ${theme.textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg></div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${theme.textSecondary}`}>To (Address)</label>
                        <input type="text" className={`w-full p-4 rounded-lg border ${theme.border} ${theme.bgPrimary} ${theme.textPrimary}`} placeholder="0x..." value={swapTokenOut} onChange={e => setSwapTokenOut(e.target.value)} />
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${theme.textSecondary}`}>Amount</label>
                        <input type="number" className={`w-full p-4 rounded-lg border ${theme.border} ${theme.bgPrimary} ${theme.textPrimary}`} placeholder="0.0" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} />
                    </div>
                    <button onClick={handleSwap} className={`w-full py-4 text-lg font-bold text-white rounded-lg shadow-lg ${walletConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500'}`}>{walletConnected ? 'Review Swap' : 'Connect Wallet to Swap'}</button>
                    <p className={`text-xs text-center ${theme.textSecondary} mt-2`}>Powered by Trackpad Router • 0.1% Fee Applied</p>
                </div>
            </div>
        </div>
    );

    const renderActivity = () => (
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Wallet Activity</h2>
            <div className={`${theme.bgSecondary} p-6 rounded-xl border ${theme.border}`}>
                {walletConnected ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className={`flex justify-between items-center p-4 rounded-lg ${theme.bgPrimary}`}>
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-full mr-4 ${i===1 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={i===1 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} /></svg>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${theme.textPrimary}`}>{i===1 ? 'Sent ETH' : 'Swap USDT -> BTC'}</p>
                                        <p className={`text-xs ${theme.textSecondary}`}>2 mins ago • Confirmed</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono ${theme.textPrimary}`}>{i===1 ? '-0.5 ETH' : '+0.02 BTC'}</p>
                                    <p className="text-xs text-gray-400">Fee: $1.20</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`text-center py-10 ${theme.textSecondary}`}>Connect wallet to view on-chain history.</div>
                )}
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6"><h2 className={`text-2xl font-bold ${theme.textPrimary}`}>Reports</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={`${theme.bgSecondary} p-6 rounded-xl border ${theme.border} cursor-pointer`} onClick={handleGenerateCIOReport}><h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>Generate CIO Report</h3><p className={theme.textSecondary}>Full portfolio analysis.</p></div></div></div>
    );

    return (
        <div className="flex h-full min-h-screen">
            {modalContent && <Modal onClose={() => setModalContent(null)}>{modalContent}</Modal>}
            <Sidebar currentView={view} setView={setView} walletConnected={walletConnected} connectWallet={handleConnectWallet} isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 p-4 overflow-y-auto lg:ml-64 md:p-8">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded ${theme.textPrimary}`}><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg></button>
                    <span className={`font-bold ${theme.accentText}`}>Trackpad</span>
                    <div className="w-8"></div>
                </div>
                {view === 'dashboard' && renderDashboard()}
                {view === 'watchlist' && renderWatchlist()}
                {view === 'recap' && renderRecap()}
                {view === 'swap' && renderSwap()}
                {view === 'activity' && renderActivity()}
                {view === 'reports' && renderReports()}
            </main>
        </div>
    );
};

export default Dashboard;