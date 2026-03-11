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

    const [newAcc, setNewAcc] = useState({
        tradovateAccountId: '',
        accountSpec: '',
        apiKey: '',
        apiSecret: '',
        cid: '',
        sec: '',
        type: 'DEMO' as 'LIVE' | 'DEMO'
    });
    const [testResults, setTestResults] = useState<Record<string, boolean>>({});
    const [formTestStatus, setFormTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
    const [foundAccounts, setFoundAccounts] = useState<any[]>([]);

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
                setNewAcc({ tradovateAccountId: '', accountSpec: '', apiKey: '', apiSecret: '', cid: '', sec: '', type: 'DEMO' });
                setFoundAccounts([]);
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
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${acc.id in testResults ? (testResults[acc.id] ? 'bg-green-500' : 'bg-red-500 animate-pulse') : 'bg-slate-200'}`} title={acc.id in testResults ? (testResults[acc.id] ? 'Connection Verified' : 'Connection Failed') : 'Not Yet Tested'} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold font-mono text-primary uppercase text-sm tracking-tight">{acc.name}</h4>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${acc.type === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {acc.type}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {acc.tradovateAccountId} · Spec: {acc.accountSpec}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={async (e) => {
                                                    const btn = e.currentTarget;
                                                    btn.disabled = true;
                                                    btn.style.opacity = '0.5';
                                                    try {
                                                        const res = await fetch(`${BASE_URL}/api/accounts/${acc.id}/test`, {
                                                            method: 'POST',
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        const d = await res.json();
                                                        setTestResults(prev => ({ ...prev, [acc.id]: d.success }));
                                                    } catch (err) {
                                                        setTestResults(prev => ({ ...prev, [acc.id]: false }));
                                                    } finally {
                                                        btn.disabled = false;
                                                        btn.style.opacity = '1';
                                                    }
                                                }}
                                                className="text-[10px] font-mono font-black border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition-all active:scale-95"
                                            >
                                                VERIFY
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAccount(acc.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="glass-card h-fit border-primary/20 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black font-mono text-xs uppercase text-primary tracking-widest">Add Connection</h4>
                                {formTestStatus !== 'idle' && (
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black ${formTestStatus === 'success' ? 'bg-green-100 text-green-600' : formTestStatus === 'fail' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 animate-pulse'}`}>
                                        {formTestStatus.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-6">
                                    {/* Step 1: Credentials */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">1</span>
                                            <label className="text-[10px] uppercase font-black font-mono text-slate-400">Tradovate Login</label>
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Username"
                                                value={newAcc.apiKey}
                                                onChange={e => setNewAcc({ ...newAcc, apiKey: e.target.value })}
                                                className="w-full p-2.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={newAcc.apiSecret}
                                                onChange={e => setNewAcc({ ...newAcc, apiSecret: e.target.value })}
                                                className="w-full p-2.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Step 2: Firm Config */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">2</span>
                                            <label className="text-[10px] uppercase font-black font-mono text-slate-400">Partner / Evaluation (e.g. APEX)</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Client ID (CID)"
                                                value={newAcc.cid}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d+$/.test(val)) setNewAcc({ ...newAcc, cid: val });
                                                }}
                                                className="w-full p-2.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="App Secret (SEC)"
                                                value={newAcc.sec}
                                                onChange={e => setNewAcc({ ...newAcc, sec: e.target.value })}
                                                className="w-full p-2.5 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-mono italic leading-tight">
                                            Leave blank for standard retail accounts. For APEX/Eval, find these in your "API Instructions" PDF.
                                        </p>
                                    </div>

                                    {/* Step 3: Environment & Connect */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">3</span>
                                            <label className="text-[10px] uppercase font-black font-mono text-slate-400">Connect & Discover</label>
                                        </div>
                                        <select
                                            className="w-full p-2.5 border border-slate-200 rounded text-xs font-mono bg-white outline-none focus:ring-1 focus:ring-primary"
                                            value={newAcc.type}
                                            onChange={e => setNewAcc({ ...newAcc, type: e.target.value as 'LIVE' | 'DEMO' })}
                                        >
                                            <option value="DEMO">Demo / Evaluation</option>
                                            <option value="LIVE">Live Trading</option>
                                        </select>

                                        <button
                                            onClick={async () => {
                                                if (!newAcc.apiKey || !newAcc.apiSecret) return alert('Enter credentials first');
                                                setFormTestStatus('testing');
                                                setFoundAccounts([]);
                                                try {
                                                    const res = await fetch(`${BASE_URL}/api/accounts/test-credentials`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            Authorization: `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify(newAcc)
                                                    });
                                                    const d = await res.json();
                                                    if (d.success) {
                                                        setFoundAccounts(d.data || []);
                                                        setFormTestStatus('success');
                                                    } else {
                                                        setFormTestStatus('fail');
                                                    }
                                                } catch (e) {
                                                    setFormTestStatus('fail');
                                                }
                                            }}
                                            className="w-full py-3 bg-slate-100 text-[10px] font-mono font-black uppercase rounded hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            {formTestStatus === 'testing' ? 'Connecting...' : 'Fetch Account List'}
                                        </button>
                                    </div>

                                    {/* Results & Selection */}
                                    {foundAccounts.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-green-200 animate-in slide-in-from-top-2">
                                            <label className="text-[10px] uppercase font-black font-mono text-green-600">Discovered Accounts (Click to Select)</label>
                                            <div className="space-y-1">
                                                {foundAccounts.map((a: any) => (
                                                    <button
                                                        key={a.id}
                                                        type="button"
                                                        onClick={() => setNewAcc({ ...newAcc, tradovateAccountId: String(a.id), accountSpec: a.name })}
                                                        className={`w-full text-left p-2 border rounded transition-all flex justify-between items-center ${newAcc.tradovateAccountId === String(a.id) ? 'bg-green-100 border-green-500' : 'bg-white border-transparent hover:border-green-200'}`}
                                                    >
                                                        <span className="text-[10px] font-mono font-bold text-slate-800">{a.name}</span>
                                                        <span className="text-[9px] font-mono text-green-600 font-black">ID: {a.id}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: Final Link */}
                                    {newAcc.tradovateAccountId && (
                                        <div className="pt-4 animate-in fade-in duration-500">
                                            <button
                                                onClick={handleAddAccount}
                                                className="btn-primary w-full py-3 text-[10px] font-mono font-black uppercase flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                            >
                                                <Plus size={14} /> Link Account: {newAcc.accountSpec}
                                            </button>
                                        </div>
                                    )}
                                </div>
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
