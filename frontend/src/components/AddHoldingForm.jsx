import React, { useState } from "react";


const AddHoldingForm = ({ onAdd }) => {
    const [type, setType] = useState('crypto');
    const [symbol, setSymbol] = useState('');
    const [qty, setQty] = useState('');
    const [buy, setBuy] = useState('');
    const [cgId, setCgId] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (type === 'crypto') {
            onAdd({
                id: crypto.randomUUID(),
                symbol: symbol.toUpperCase(),
                type,
                coingeckoId: cgId,
                cmcSymbol: symbol.toUpperCase(),
                name: symbol.toUpperCase(),
                quantity: parseFloat(qty) || 0,
                purchasePrice: parseFloat(buy) || 0,
                price: 0
            });
        } else {
            onAdd({
                id: crypto.randomUUID(),
                symbol: symbol.toUpperCase(),
                type,
                name: symbol.toUpperCase(),
                quantity: parseFloat(qty) || 0,
                purchasePrice: parseFloat(buy) || 0,
                price: 0
            });
        }
        setSymbol(''); setQty(''); setBuy(''); setCgId('');
    };
    const input = "w-full p-5 bg-black border border-white/5 rounded-[22px] text-white text-[11px] font-black uppercase tracking-widest focus:border-blue-500 transition focus:outline-none";
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <select value={type} onChange={e=>setType(e.target.value)} className={input}><option value="crypto">Cryptocurrency</option><option value="stock">Equity / Stock</option></select>
            <input type="text" placeholder="Ticker" value={symbol} onChange={e=>setSymbol(e.target.value)} className={input} required />
            {type === 'crypto' && <input type="text" placeholder="CoinGecko ID" value={cgId} onChange={e=>setCgId(e.target.value)} className={input} required />}
            <input type="number" placeholder="Qty" value={qty} onChange={e=>setQty(e.target.value)} className={input} />
            <input type="number" placeholder="Cost" value={buy} onChange={e=>setBuy(e.target.value)} className={input} />
            <div className="col-span-2 lg:col-span-5 flex justify-end">
                <button type="submit" className="px-16 py-6 bg-white text-black font-black rounded-3xl uppercase tracking-widest hover:bg-yellow-500 transition active:scale-95 shadow-xl">Sync Asset</button>
            </div>
        </form>
    );
};
export default AddHoldingForm;
