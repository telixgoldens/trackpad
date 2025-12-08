import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const AddHoldingForm = ({ onAdd }) => {
    const { theme } = useTheme();
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('crypto');
    const [quantity, setQuantity] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [apiId, setApiId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!symbol || !quantity || !purchasePrice) return;
        onAdd({
            id: crypto.randomUUID(), symbol: symbol.toUpperCase(), name: name || symbol.toUpperCase(), type,
            apiId: type === 'crypto' ? (apiId || symbol.toLowerCase()) : null,
            quantity: parseFloat(quantity), purchasePrice: parseFloat(purchasePrice), price: parseFloat(purchasePrice), change: 0, 
        });
        setSymbol(''); setName(''); setQuantity(''); setPurchasePrice(''); setApiId('');
    };

    const inputClass = `w-full p-3 border ${theme.border} rounded-lg ${theme.bgPrimary} ${theme.textPrimary}`;
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-6 gap-4 pt-4 border-t border-dashed">
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>Symbol</label><input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputClass} placeholder="BTC" required /></div>
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Bitcoin" /></div>
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>CoinGecko ID</label><input type="text" value={apiId} onChange={(e) => setApiId(e.target.value)} className={inputClass} placeholder="bitcoin" /></div>
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}><option value="crypto">Crypto</option><option value="stock">Stock</option></select></div>
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>Qty</label><input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} required /></div>
            <div><label className={`block text-xs mb-1 ${theme.textSecondary}`}>Buy Price</label><input type="number" step="any" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={inputClass} required /></div>
            <div className="col-span-2 lg:col-span-6 flex justify-end"><button type="submit" className={`px-6 py-3 rounded-lg font-bold transition duration-300 shadow-md ${theme.accentBg} text-white`}>Add Holding</button></div>
        </form>
    );
};
export default AddHoldingForm;