import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { LineChart, Filter } from 'lucide-react';

export const Analytics = () => {
    const { token } = useAuthStore();
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const [stats, setStats] = useState({
        winRate: '--',
        profitFactor: '--',
        totalTrades: '--',
        netPnl: '--',
        maxDrawdown: '--'
    });

    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState<{ accounts: any[], strategies: string[] }>({ accounts: [], strategies: [] });

    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');

    useEffect(() => {
        // Fetch dropdown filters
        fetch(`${BASE_URL}/api/trades/filters`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                if (d.success) setFilters({ accounts: d.accounts, strategies: d.strategies });
            });
    }, [token]);

    useEffect(() => {
        setLoading(true);
        const query = new URLSearchParams();
        if (selectedAccount) query.append('accountId', selectedAccount);
        if (selectedStrategy) query.append('strategy', selectedStrategy);

        fetch(`${BASE_URL}/api/trades/analytics?${query.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStats(data.stats);
                    setSeries(data.series);
                }
            })
            .finally(() => setLoading(false));
    }, [selectedAccount, selectedStrategy, token]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase flex items-center gap-3">
                        <LineChart size={32} /> Quant Analytics
                    </h2>
                    <p className="text-muted mt-2 font-mono text-sm">Sharpe ratio, max drawdowns, and expectancy metrics.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-mono text-slate-500 uppercase tracking-widest pl-2">
                        <Filter size={16} /> Filters
                    </div>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-sm font-mono bg-slate-50 outline-none w-auto min-w-[150px] focus:border-primary transition-all"
                    >
                        <option value="">All Accounts</option>
                        {filters.accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name || acc.accountSpec}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStrategy}
                        onChange={(e) => setSelectedStrategy(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-sm font-mono bg-slate-50 outline-none w-auto min-w-[150px] focus:border-primary transition-all"
                    >
                        <option value="">All Strategies</option>
                        {filters.strategies.map(strat => (
                            <option key={strat} value={strat}>{strat}</option>
                        ))}
                    </select>
                </div>
            </header>

            <section className="glass-card h-[400px] relative">
                <h3 className="text-lg font-bold font-mono mb-4 text-slate-800">Cumulative Returns</h3>
                {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex justify-center items-center z-10 font-mono text-primary font-bold">CALCULATING METRICS...</div>}

                {series.length === 0 && !loading ? (
                    <div className="w-full h-full flex justify-center items-center font-mono text-slate-400 text-sm">NO TRADE DATA FOUND</div>
                ) : (
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={series}>
                            <XAxis dataKey="day" fontFamily="Fira Code" fontSize={12} stroke="#94A3B8" />
                            <YAxis fontFamily="Fira Code" fontSize={12} stroke="#94A3B8" />
                            <Tooltip contentStyle={{ fontFamily: 'Fira Code', fontSize: '12px', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="pnl" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.1} strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Net P&L', value: `$${stats.netPnl}`, color: 'text-green-600' },
                    { label: 'Total Trades', value: stats.totalTrades, color: 'text-slate-800' },
                    { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-blue-600' },
                    { label: 'Profit Factor', value: stats.profitFactor, color: 'text-emerald-600' },
                    { label: 'Max Drawdown', value: `-$${stats.maxDrawdown}`, color: 'text-red-600' }
                ].map(stat => (
                    <div key={stat.label} className="glass-card flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">{stat.label}</span>
                        <span className={`text-2xl font-black font-mono mt-2 ${stat.color}`}>
                            {stat.value === '$--' || stat.value === '--%' || stat.value === '-$--' ? '--' : stat.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
