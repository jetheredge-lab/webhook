import { useState } from 'react';
import { Plus, Trash, Copy, CheckCircle, Code } from 'lucide-react';

interface TradovateAccount {
    id: string;
    token: string;
    account_id: string;
    risk_percentage: number;
    quantity_multiplier: number;
}

export const AlertGenerator = () => {
    const [strategy, setStrategy] = useState('STRATEGY');
    const [strategyName, setStrategyName] = useState('Alpha_Release_1');
    const [symbol, setSymbol] = useState('{{ticker}}');
    const [multipleExits, setMultipleExits] = useState('YES');

    const [accounts, setAccounts] = useState<TradovateAccount[]>([
        {
            id: '1',
            token: 'pb2b2db618dea3a56487e9',
            account_id: 'APEX5103100000001',
            risk_percentage: 0,
            quantity_multiplier: 1
        }
    ]);

    const [copiedJson, setCopiedJson] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    const webhookUrl = `${window.location.protocol}//${window.location.hostname}:3001/webhook/tradingview`;

    const addAccount = () => {
        const newAccount: TradovateAccount = {
            id: Math.random().toString(36).substr(2, 9),
            token: '',
            account_id: '',
            risk_percentage: 0,
            quantity_multiplier: 1
        };
        setAccounts([...accounts, newAccount]);
    };

    const removeAccount = (id: string) => {
        setAccounts(accounts.filter(a => a.id !== id));
    };

    const updateAccount = (id: string, field: keyof TradovateAccount, value: string | number) => {
        setAccounts(accounts.map(acc =>
            acc.id === id ? { ...acc, [field]: value } : acc
        ));
    };

    const generateJson = () => {
        return JSON.stringify({
            symbol: symbol,
            date: "{{timenow}}",
            data: "{{strategy.order.action}}",
            quantity: "{{strategy.order.contracts}}",
            risk_percentage: 0,
            price: "{{close}}",
            tp: 0,
            percentage_tp: 0,
            dollar_tp: 0,
            sl: 0,
            dollar_sl: 0,
            percentage_sl: 0,
            trail: 0,
            trail_stop: 0,
            trail_trigger: 0,
            trail_freq: 0,
            update_tp: false,
            update_sl: false,
            breakeven: 0,
            breakeven_offset: 0,
            token: accounts.length > 0 ? accounts[0].token : "",
            pyramid: true,
            same_direction_ignore: false,
            reverse_order_close: false,
            strategy: strategyName,
            multiple_accounts: accounts.map(({ id, ...rest }) => rest)
        }, null, 2);
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(generateJson());
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <header>
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Alert Generator</h2>
                <p className="text-muted mt-2 font-mono text-sm">Configure and map signals across routing engines dynamically.</p>
            </header>

            {/* TradingView Info */}
            <section className="glass-card">
                <h3 className="text-xl font-bold font-mono text-primary mb-6">TradingView Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 font-mono mb-2">Select TradingView Strategy / Indicator</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="STRATEGY">STRATEGY</option>
                            <option value="INDICATOR">INDICATOR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 font-mono mb-2">Strategy / Bot Name</label>
                        <input
                            type="text"
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                            placeholder="e.g. Breakout_Bot_V1"
                            className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 font-mono mb-2">TradingView Symbol</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Exit Strategy Type */}
            <section className="glass-card">
                <h3 className="text-xl font-bold font-mono text-primary mb-6">Exit Strategy Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 font-mono mb-2">Would your strategy have multiple exit like TP1, TP2 etc ?</label>
                        <select
                            value={multipleExits}
                            onChange={(e) => setMultipleExits(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                        </select>
                    </div>
                    <div className="text-sm font-mono text-slate-500 bg-slate-50 p-4 border border-slate-100 rounded">
                        If your strategy has multiple take profits, it can be automated. However, you can't attach take profit or stop loss directly to the entry order natively.
                    </div>
                </div>

                <button className="text-accent underline font-mono text-sm mt-6 hover:text-yellow-600">Show Advanced Options</button>
            </section>

            {/* Added Tradovate Accounts */}
            <section className="glass-card">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold font-mono text-primary">Added Tradovate Accounts</h3>
                    <button onClick={addAccount} className="btn-accent flex items-center gap-2">
                        <Plus size={16} /> ADD ACCOUNT
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-4 px-2">TOKEN</th>
                                <th className="py-4 px-2">ACCOUNT ID / NAME</th>
                                <th className="py-4 px-2">RISK %</th>
                                <th className="py-4 px-2">QTY MULTIPLIER</th>
                                <th className="py-4 px-2 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-2">
                                        <input
                                            type="text"
                                            value={acc.token}
                                            onChange={(e) => updateAccount(acc.id, 'token', e.target.value)}
                                            placeholder="e.g. pb2b..."
                                            className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                                        />
                                    </td>
                                    <td className="py-3 px-2">
                                        <input
                                            type="text"
                                            value={acc.account_id}
                                            onChange={(e) => updateAccount(acc.id, 'account_id', e.target.value)}
                                            placeholder="e.g. APEX..."
                                            className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                                        />
                                    </td>
                                    <td className="py-3 px-2 w-24">
                                        <input
                                            type="number"
                                            value={acc.risk_percentage}
                                            onChange={(e) => updateAccount(acc.id, 'risk_percentage', Number(e.target.value))}
                                            className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                                        />
                                    </td>
                                    <td className="py-3 px-2 w-32">
                                        <input
                                            type="number"
                                            value={acc.quantity_multiplier}
                                            onChange={(e) => updateAccount(acc.id, 'quantity_multiplier', Number(e.target.value))}
                                            className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                                        />
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <button
                                            onClick={() => removeAccount(acc.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-muted border-b border-slate-100">
                                        No accounts attached. Add accounts mapping to attach signal logic.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Final JSON Output */}
            <section className="glass-card bg-slate-900 text-slate-300">
                <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-800">
                    <div className="flex-1">
                        <h4 className="text-sm font-bold font-mono tracking-widest text-slate-400 mb-2">TARGET WEBHOOK URL</h4>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={webhookUrl}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-3 font-mono text-sm text-green-400 outline-none"
                            />
                            <button
                                onClick={handleCopyUrl}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2 font-mono text-sm whitespace-nowrap"
                            >
                                {copiedUrl ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />} COPY URL
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                        <Code size={18} className="text-accent" /> TRADINGVIEW JSON PAYLOAD
                    </h3>
                    <button
                        onClick={handleCopyJson}
                        className="bg-accent text-white px-6 py-2 rounded transition-colors flex items-center gap-2 font-mono text-sm font-bold hover:bg-yellow-700"
                    >
                        {copiedJson ? <CheckCircle size={16} /> : <Copy size={16} />} COPY PAYLOAD
                    </button>
                </div>

                <pre className="bg-slate-950 p-6 rounded border border-slate-800 overflow-x-auto text-sm font-mono leading-relaxed text-green-400">
                    {generateJson()}
                </pre>
            </section>

        </div>
    );
};
