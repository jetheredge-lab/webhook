import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const BASE_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setToken(data.token);
                navigate('/');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Network error connecting to auth server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background absolute inset-0 z-50">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 mb-6 shadow-2xl border border-slate-800">
                        <ShieldAlert size={36} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-black font-mono tracking-tighter uppercase text-slate-800">System <span className="text-primary">Secured</span></h1>
                    <p className="text-muted font-mono mt-3 text-sm tracking-wide">Enter root credentials to grant access.</p>
                </div>

                <form onSubmit={handleLogin} className="glass-card shadow-2xl space-y-6 !p-8 border border-slate-200">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded text-sm font-mono border border-red-100 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Operator ID</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded p-4 font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                            placeholder="admin"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Authorization Key</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded p-4 font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                            placeholder="••••••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-yellow-600 text-white font-black font-mono tracking-widest uppercase py-4 rounded transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Initialize Session'}
                    </button>
                </form>
            </div>
        </div>
    );
};
