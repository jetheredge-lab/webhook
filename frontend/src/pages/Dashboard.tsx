import React, { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import { io } from 'socket.io-client';

export const Dashboard = () => {
    const [livePositions, setLivePositions] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Mock Socket.io connection logic for the dashboard
    useEffect(() => {
        // In production we hit /socket.io through Nginx, falling back to 3001 if dev
        const socketUrl = import.meta.env.DEV ? 'http://localhost:3001' : '/';
        const socket = io(socketUrl, { transports: ['websocket'] });

        socket.on('connect', () => console.log('Connected to real-time engine'));
        // socket.on('position-update', data => setLivePositions(...));

        return () => { socket.disconnect(); };
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Live Operations</h2>
                <p className="text-muted mt-2 font-mono text-sm">Real-time system health and active market exposure.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Realtime Positions Card */}
                <section className="glass-card flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Open Positions</h3>
                        <Activity className="text-accent animate-pulse" />
                    </div>

                    <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-sm bg-slate-50/50 rounded-lg border border-slate-100 border-dashed">
                        {livePositions.length === 0 ? 'NO ACTIVE EXPOSURE' : 'LIST POSITIONS HERE'}
                    </div>
                </section>

                {/* Incoming Webhooks Log Card */}
                <section className="glass-card flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-xl font-bold font-mono">Recent Hooks</h3>
                        <Clock className="text-slate-400" />
                    </div>

                    <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-sm bg-slate-50/50 rounded-lg border border-slate-100 border-dashed">
                        LOADING EVENTS STREAM...
                    </div>
                </section>

            </div>
        </div>
    );
};
