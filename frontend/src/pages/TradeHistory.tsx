import React from 'react';

export const TradeHistory = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-mono font-black text-primary tracking-tighter uppercase">Trade Ledger</h2>
                    <p className="text-muted mt-2 font-mono text-sm">Complete immutable back-book of historical orders.</p>
                </div>
                <button className="btn-primary">EXPORT CSV</button>
            </header>

            <section className="glass-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-4">DATE</th>
                                <th className="py-4">SYMBOL</th>
                                <th className="py-4">DIR</th>
                                <th className="py-4">QTY</th>
                                <th className="py-4">ENTRY</th>
                                <th className="py-4">NET PNL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted">No historical trades found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
