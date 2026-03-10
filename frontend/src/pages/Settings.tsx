import { useState, useEffect } from 'react';
import { Database, Key, Trash, Plus, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Account {
    id: string;
    tradovateAccountId: string;
    accountSpec: string;
    name: string;
    type: 'LIVE' | 'DEMO';
}

export const Settings = () => {
    const { token } = useAuthStore();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [webhookSecret, setWebhookSecret] = useState('****************');
    const [revealSecret, setRevealSecret] = useState(false);

    // Form State
    const [newAcc, setNewAcc] = useState({
        tradovateAccountId: '',
        accountSpec: '',
        apiKey: '',
        apiSecret: '',
        type: 'DEMO' as 'LIVE' | 'DEMO'
    });

    const BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchAccounts();
        fetchWebhookSecret();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setAccounts(data.data);
        } catch (e) {
            console.error('Failed to fetch accounts', e);
        }
    };

    const fetchWebhookSecret = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/auth/webhook-secret`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setWebhookSecret(d => revealSecret ? data.secret : '****************');
        } catch (e) {
            console.error('Failed to fetch secret', e);
        }
    };

    const handleAddAccount = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newAcc)
            });
            const data = await res.json();
            if (data.success) {
                setAccounts([...accounts, data.data]);
                setNewAcc({ tradovateAccountId: '', accountSpec: '', apiKey: '', apiSecret: '', type: 'DEMO' });
            }
        } catch (e) {
            console.error('Failed to add account', e);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        try {
            const res = await fetch(`${BASE_URL}/api/accounts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(accounts.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error('Failed to delete account', e);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <header className="mb-12">
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Platform Config</h2>
                <p className="text-muted mt-2 font-mono text-sm">Broker connections, security policies, and application tuning.</p>
            </header>

            <div className="space-y-12">
                {/* Account Management */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="text-primary" />
                        <h3 className="text-2xl font-bold font-mono text-primary uppercase">Tradovate Accounts</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            {accounts.length === 0 ? (
                                <div className="glass-card text-center py-12">
                                    <p className="font-mono text-sm text-slate-400">No linked accounts found.</p>
                                </div>
                            ) : (
                                accounts.map(acc => (
                                    <div key={acc.id} className="glass-card flex items-center justify-between group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold font-mono text-primary">{acc.name}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${acc.type === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {acc.type}
                                                </span>
                                            </div>
                                            <p className="text-xs font-mono text-slate-500 mt-1">ID: {acc.tradovateAccountId} | Spec: {acc.accountSpec}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAccount(acc.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="glass-card h-fit">
                            <h4 className="font-bold font-mono text-sm uppercase mb-4 text-primary">Add Connection</h4>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Numerical Account ID"
                                    value={newAcc.tradovateAccountId}
                                    onChange={e => setNewAcc({ ...newAcc, tradovateAccountId: e.target.value })}
                                    className="w-full p-2 border rounded text-xs font-mono"
                                />
                                <input
                                    type="text"
                                    placeholder="Account Spec (e.g. DEMO_1)"
                                    value={newAcc.accountSpec}
                                    onChange={e => setNewAcc({ ...newAcc, accountSpec: e.target.value })}
                                    className="w-full p-2 border rounded text-xs font-mono"
                                />
                                <input
                                    type="text"
                                    placeholder="API Key / Username"
                                    value={newAcc.apiKey}
                                    onChange={e => setNewAcc({ ...newAcc, apiKey: e.target.value })}
                                    className="w-full p-2 border rounded text-xs font-mono"
                                />
                                <input
                                    type="password"
                                    placeholder="API Secret / Password"
                                    value={newAcc.apiSecret}
                                    onChange={e => setNewAcc({ ...newAcc, apiSecret: e.target.value })}
                                    className="w-full p-2 border rounded text-xs font-mono"
                                />
                                <select
                                    className="w-full p-2 border rounded text-xs font-mono bg-white"
                                    value={newAcc.type}
                                    onChange={e => setNewAcc({ ...newAcc, type: e.target.value as 'LIVE' | 'DEMO' })}
                                >
                                    <option value="DEMO">Simulation (Demo)</option>
                                    <option value="LIVE">Live Trading</option>
                                </select>
                                <button
                                    onClick={handleAddAccount}
                                    className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                                >
                                    <Plus size={14} /> LINK BROKER
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Identity Verification (Webhook Secret) */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Key className="text-primary" />
                        <h3 className="text-2xl font-bold font-mono text-primary uppercase">Identity Verification</h3>
                    </div>
                    <div className="glass-card">
                        <p className="font-mono text-sm text-slate-500 mb-6">
                            This is your internal <strong>Webhook Secret</strong>. It must be included in the JSON of every TradingView alert to prove the signal is coming from your authorized setup.
                        </p>
                        <div className="flex bg-slate-900 text-green-400 p-4 rounded items-center justify-between font-mono gap-4 overflow-hidden">
                            <span className="tracking-widest truncate">
                                {revealSecret ? webhookSecret : '****************'}
                            </span>
                            <button
                                onClick={async () => {
                                    if (!revealSecret) {
                                        const res = await fetch(`${BASE_URL}/api/auth/webhook-secret`, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        const d = await res.json();
                                        if (d.success) setWebhookSecret(d.secret);
                                    }
                                    setRevealSecret(!revealSecret);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-white transition-all flex-shrink-0"
                            >
                                {revealSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle size={10} className="text-green-500" /> This secret is managed in your server's .env configuration.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};
