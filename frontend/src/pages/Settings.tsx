import React from 'react';
import { Settings as SettingsIcon, Database, Key, CheckCircle } from 'lucide-react';

export const Settings = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <header className="mb-12">
                <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Platform Config</h2>
                <p className="text-muted mt-2 font-mono text-sm">Broker connections, security policies, and application tuning.</p>
            </header>

            <div className="space-y-12">
                {/* API Integration Block */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="text-primary" />
                        <h3 className="text-2xl font-bold font-mono text-primary uppercase">Tradovate Accounts</h3>
                    </div>
                    <div className="glass-card space-y-4">
                        <p className="font-mono text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">No accounts currently active.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Account Spec (e.g. DEMO_123)" className="p-3 border rounded text-sm font-mono" />
                            <input type="password" placeholder="API Secret" className="p-3 border rounded text-sm font-mono" />
                        </div>
                        <button className="btn-primary mt-4">ADD ACCOUNT CACHE</button>
                    </div>
                </section>

                {/* Webhook Secret Block */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Key className="text-primary" />
                        <h3 className="text-2xl font-bold font-mono text-primary uppercase">Identity Verification</h3>
                    </div>
                    <div className="glass-card">
                        <p className="font-mono text-sm text-slate-500 mb-6">The Webhook secret required inside every TV JSON payload payload to be parsed properly.</p>
                        <div className="flex bg-slate-100 p-4 rounded items-center justify-between">
                            <span className="font-mono font-bold tracking-widest mt-1 text-slate-800">********************</span>
                            <button className="text-primary hover:text-accent font-mono text-sm">REVEAL</button>
                        </div>
                    </div>
                </section>
            </div>

        </div>
    );
};
