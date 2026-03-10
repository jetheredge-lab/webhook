import React, { useEffect, useState } from 'react';
import { Activity, Clock, Inbox, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Dashboard = () => {
    const { token } = useAuthStore();
    const [livePositions, setLivePositions] = useState([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchRecentHooks();
        const interval = setInterval(fetchRecentHooks, 5000); // Polling for now
        return () => clearInterval(interval);
    }, []);

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
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Live Operations</h2>
                <p className="text-muted mt-2 font-mono text-sm">Real-time system health and active market exposure.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Realtime Positions Card */}
                <section className="glass-card flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Open Positions</h3>
                        <Activity className="text-accent animate-pulse" />
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-mono text-sm bg-slate-50/50 rounded-lg border border-slate-100 border-dashed">
                        {livePositions.length === 0 ? (
                            <>
                                <Inbox className="mb-2 opacity-20" size={48} />
                                <span>NO ACTIVE EXPOSURE</span>
                            </>
                        ) : 'LIST POSITIONS HERE'}
                    </div>
                </section>

                {/* Incoming Webhooks Log Card */}
                <section className="glass-card flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Recent Hooks</h3>
                        <Clock className="text-slate-400" />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">LOADING STREAM...</div>
                        ) : alerts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs italic">WAITING FOR SIGNALS...</div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${alert.action === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Activity size={16} />
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
