import { useState, useEffect } from 'react';
import { Plus, Trash, Copy, CheckCircle, Code, ShieldCheck, Database, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DBAccount {
    id: string;
    tradovateAccountId: string;
    accountSpec: string;
    name: string;
    type: 'LIVE' | 'DEMO';
}

interface SelectedAccount {
    account_id: string; // The Tradovate Account ID
    name: string;
    risk_percentage: number;
    quantity_multiplier: number;
}

export const AlertGenerator = () => {
    const { token } = useAuthStore();
    const [strategy, setStrategy] = useState('STRATEGY');
    const [strategyName, setStrategyName] = useState('Alpha_Alpha_1');
    const [symbol, setSymbol] = useState('{{ticker}}');
    const [multipleExits, setMultipleExits] = useState('YES');

    const [availableAccounts, setAvailableAccounts] = useState<DBAccount[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccount[]>([]);
    const [webhookSecret, setWebhookSecret] = useState('REPLACE_WITH_WEBHOOK_SECRET');

    const [copiedJson, setCopiedJson] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    const BASE_URL = import.meta.env.VITE_API_URL || '';
    const webhookUrl = `${window.location.protocol}//${window.location.hostname}/webhook/tradingview`;

    useEffect(() => {
        // Fetch Webhook Secret
        fetch(`${BASE_URL}/api/auth/webhook-secret`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.success) setWebhookSecret(d.secret); })
            .catch(console.error);

        // Fetch DB Accounts
        fetch(`${BASE_URL}/api/accounts`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setAvailableAccounts(d.data);
                    // Default select the first one if it exists
                    if (d.data.length > 0 && selectedAccounts.length === 0) {
                        setSelectedAccounts([{
                            account_id: d.data[0].tradovateAccountId,
                            name: d.data[0].name,
                            risk_percentage: 0,
                            quantity_multiplier: 1
                        }]);
                    }
                }
            })
            .catch(console.error);
    }, [token]);

    const toggleAccountSelection = (acc: DBAccount) => {
        const isSelected = selectedAccounts.some(a => a.account_id === acc.tradovateAccountId);
        if (isSelected) {
            setSelectedAccounts(selectedAccounts.filter(a => a.account_id !== acc.tradovateAccountId));
        } else {
            setSelectedAccounts([...selectedAccounts, {
                account_id: acc.tradovateAccountId,
                name: acc.name,
                risk_percentage: 0,
                quantity_multiplier: 1
            }]);
        }
    };

    const updateSelectedAccount = (accountId: string, field: keyof SelectedAccount, value: any) => {
        setSelectedAccounts(selectedAccounts.map(acc =>
            acc.account_id === accountId ? { ...acc, [field]: value } : acc
        ));
    };

    const generateJson = () => {
        return JSON.stringify({
            secret: webhookSecret,
            symbol: symbol,
            date: "{{timenow}}",
            data: "{{strategy.order.action}}",
            quantity: "{{strategy.order.contracts}}",
            price: "{{close}}",
            strategy: strategyName,
            multiple_accounts: selectedAccounts.map(({ name, ...rest }) => rest)
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
                <p className="text-muted mt-2 font-mono text-sm">Map TradingView signals directly to your broker accounts.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* TradingView Config */}
                    <section className="glass-card">
                        <h3 className="text-xl font-bold font-mono text-primary mb-6 flex items-center gap-2">
                            <Code size={20} /> Signal Config
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-2">Strategy Name</label>
                                <input
                                    type="text"
                                    value={strategyName}
                                    onChange={(e) => setStrategyName(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase mb-2">Symbol (Ticker)</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded font-mono text-sm bg-slate-50 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Account Selection Mapping */}
                    <section className="glass-card">
                        <h3 className="text-xl font-bold font-mono text-primary mb-6 flex items-center gap-2">
                            <LinkIcon size={20} /> Broker Mapping
                        </h3>

                        <div className="space-y-6">
                            <p className="text-xs font-mono text-slate-500">Select which linked accounts should trade when this signal triggers.</p>

                            <div className="grid grid-cols-1 gap-3">
                                {availableAccounts.map(acc => {
                                    const selected = selectedAccounts.find(s => s.account_id === acc.tradovateAccountId);
                                    return (
                                        <div key={acc.id} className={`p-4 border rounded-lg transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={() => toggleAccountSelection(acc)}
                                                        className="w-4 h-4 accent-primary"
                                                    />
                                                    <div>
                                                        <span className="font-bold font-mono text-sm">{acc.name}</span>
                                                        <span className="text-[10px] ml-2 font-mono text-slate-400">({acc.tradovateAccountId})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selected && (
                                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary/10">
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-slate-500 font-mono uppercase">Qty Multiplier</label>
                                                        <input
                                                            type="number"
                                                            value={selected.quantity_multiplier}
                                                            onChange={e => updateSelectedAccount(acc.tradovateAccountId, 'quantity_multiplier', Number(e.target.value))}
                                                            className="w-full bg-white p-2 border rounded text-xs font-mono mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-slate-500 font-mono uppercase">Risk % Offset</label>
                                                        <input
                                                            type="number"
                                                            value={selected.risk_percentage}
                                                            onChange={e => updateSelectedAccount(acc.tradovateAccountId, 'risk_percentage', Number(e.target.value))}
                                                            className="w-full bg-white p-2 border rounded text-xs font-mono mt-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {availableAccounts.length === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded">
                                        <p className="text-sm font-mono text-slate-400">No accounts found in Settings.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Output */}
                <div className="space-y-8">
                    <section className="glass-card bg-slate-900 border-none shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black font-mono tracking-widest text-slate-500 uppercase">Alert Payload</h4>
                            <button
                                onClick={handleCopyJson}
                                className="text-accent hover:text-white transition-colors"
                            >
                                {copiedJson ? <CheckCircle size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <pre className="text-[10px] font-mono text-green-400 leading-relaxed overflow-x-auto">
                            {generateJson()}
                        </pre>

                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <h4 className="text-xs font-black font-mono tracking-widest text-slate-500 uppercase mb-4">Webhook Target</h4>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[10px] text-slate-400 break-all">
                                {webhookUrl}
                            </div>
                            <button
                                onClick={handleCopyUrl}
                                className="w-full mt-3 py-2 bg-slate-800 text-xs font-mono text-white rounded hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                {copiedUrl ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />} COPY WEBHOOK URL
                            </button>
                        </div>
                    </section>

                    <div className="glass-card bg-primary text-white p-6">
                        <ShieldCheck className="mb-4 opacity-50" size={32} />
                        <h4 className="font-bold font-mono text-sm leading-tight uppercase">Security Notice</h4>
                        <p className="text-[11px] font-mono mt-2 opacity-80 leading-relaxed">
                            The "secret" field in the JSON payload is your unique server key. Without it, the backend will drop any incoming signals immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
