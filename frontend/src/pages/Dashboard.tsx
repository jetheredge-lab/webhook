import React, { useEffect, useState } from 'react';
import { Activity, Clock, Inbox, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Dashboard = () => {
    const { token } = useAuthStore();
    const [livePositions, setLivePositions] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [loadingPositions, setLoadingPositions] = useState(true);

    const BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchAll = () => {
        fetchRecentHooks();
        fetchPositions();
    };

    const fetchRecentHooks = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/webhook/recent`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAlerts(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch hooks', e);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const fetchPositions = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/trades/positions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLivePositions(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch positions', e);
        } finally {
            setLoadingPositions(false);
        }
    };

    const handleClosePosition = async (accountId: string, contractId: number) => {
        if (!confirm('Are you sure you want to LIQUIDATE this position?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/trades/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ accountId, contractId })
            });
            const data = await res.json();
            if (data.success) {
                alert('Liquidation order sent');
                fetchPositions();
            }
        } catch (e) {
            alert('Failed to liquidate');
        }
    };

    const handleCloseAll = async () => {
        if (!confirm('!!! PANIC !!!\nAre you sure you want to LIQUIDATE EVERY OPEN POSITION across all accounts?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/trades/close-all`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert('Panic liquidation initiated');
                fetchPositions();
            }
        } catch (e) {
            alert('Panic failed');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Live Operations</h2>
                    <p className="text-muted mt-2 font-mono text-sm">Real-time system health and active market exposure.</p>
                </div>
                {livePositions.length > 0 && (
                    <button
                        onClick={handleCloseAll}
                        className="bg-red-600 hover:bg-red-700 text-white font-black font-mono text-xs px-6 py-3 rounded-full shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase tracking-widest"
                    >
                        Emergency Liquidate All
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Realtime Positions Card */}
                <section className="glass-card flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Open Positions</h3>
                        <Activity className={`text-accent ${livePositions.length > 0 ? 'animate-pulse' : ''}`} />
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {loadingPositions ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs italic">SYNCRONIZING POSITIONS...</div>
                        ) : livePositions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 font-mono text-sm opacity-50 space-y-3">
                                <Inbox size={64} className="opacity-10" />
                                <span>NO ACTIVE EXPOSURE</span>
                            </div>
                        ) : (
                            livePositions.map((pos, i) => (
                                <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${pos.netPos > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            <span className="font-black text-xs font-mono">{pos.netPos > 0 ? 'LONG' : 'SHRT'}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-black font-mono text-slate-800 tracking-tight uppercase">CID: {pos.contractId}</h5>
                                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{pos.accountSpec}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                                                <span>Qty: <b className="text-slate-600">{Math.abs(pos.netPos)}</b></span>
                                                <span>Price: <b className="text-slate-600">{pos.prevClose || '---'}</b></span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleClosePosition(pos.accountId, pos.contractId)}
                                        className="btn-primary bg-slate-900 border-none px-4 py-2 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-black uppercase"
                                    >
                                        Close
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Incoming Webhooks Log Card */}
                <section className="glass-card flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Recent Hooks</h3>
                        <Clock className="text-slate-400" />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {loadingAlerts ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">LOADING STREAM...</div>
                        ) : alerts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 font-mono text-sm opacity-50 space-y-3">
                                <Activity size={64} className="opacity-10" />
                                <span>WAITING FOR SIGNALS</span>
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${alert.action === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Activity size={14} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold font-mono text-sm text-slate-800 tracking-tight uppercase">{alert.symbol}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${alert.action === 'buy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                    {alert.action}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                {new Date(alert.receivedAt).toLocaleTimeString()} · Qty: {alert.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {alert.processed ?
                                            (alert.processingError ? (
                                                <span title={alert.processingError}>
                                                    <XCircle size={14} className="text-red-400" />
                                                </span>
                                            ) : <CheckCircle size={14} className="text-green-500" />)
                                            : <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        }
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};
