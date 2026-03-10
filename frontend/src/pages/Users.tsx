import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users as UsersIcon, Plus, UserX, KeyRound, ShieldAlert } from 'lucide-react';

interface User {
    id: string;
    username: string;
    role: string;
    createdAt: string;
}

export const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState<string | null>(null);

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('USER');
    const [resetPassword, setResetPassword] = useState('');

    const { token } = useAuthStore();
    const BASE_URL = import.meta.env.VITE_API_URL || '';

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewUsername('');
                setNewPassword('');
                setNewRole('USER');
                fetchUsers();
            } else {
                alert('Failed to create user. Username may exist.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${BASE_URL}/api/users/${showResetModal}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: resetPassword })
            });
            if (res.ok) {
                setShowResetModal(null);
                setResetPassword('');
                alert('Password successfully reset.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black font-mono tracking-tighter uppercase text-slate-800">System <span className="text-primary">Users</span></h1>
                    <p className="text-muted font-mono mt-2 text-sm tracking-wide">Manage internal operator access and credentials.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold font-mono py-3 px-6 rounded inline-flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Add Operator
                </button>
            </div>

            <div className="glass-card shadow-lg flex-1 border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Operator ID</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Role Segment</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Date Provisioned</th>
                            <th className="p-4 font-mono w-48 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-mono">Loading operators...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-mono">No operators found.</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-sm text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex justify-center items-center">
                                                <UsersIcon size={14} className="text-slate-500" />
                                            </div>
                                            {u.username}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-mono tracking-widest px-2 py-1 rounded-full border ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-slate-600">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setShowResetModal(u.id)} className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-yellow-50 rounded" title="Reset Key">
                                            <KeyRound size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded" title="Revoke Access">
                                            <UserX size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
                    <form onSubmit={handleAddUser} className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-800 mb-6 uppercase flex items-center gap-2"><ShieldAlert size={20} className="text-primary" /> Provision Operator</h2>
                        <div className="space-y-4 font-mono text-sm">
                            <div>
                                <label className="block text-slate-500 mb-1 text-xs uppercase tracking-widest">Operator ID</label>
                                <input required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3" />
                            </div>
                            <div>
                                <label className="block text-slate-500 mb-1 text-xs uppercase tracking-widest">Initial Key</label>
                                <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3" />
                            </div>
                            <div>
                                <label className="block text-slate-500 mb-1 text-xs uppercase tracking-widest">Clearance Level</label>
                                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3 outline-none">
                                    <option value="USER">Base User</option>
                                    <option value="ADMIN">System Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 text-sm font-mono font-bold">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded">CANCEL</button>
                            <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 tracking-widest uppercase">PROVISION</button>
                        </div>
                    </form>
                </div>
            )}

            {showResetModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
                    <form onSubmit={handleResetPassword} className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-800 mb-2 uppercase flex items-center gap-2"><KeyRound size={20} className="text-red-500" /> Force Reset Key</h2>
                        <p className="text-xs text-slate-500 mb-6 font-mono leading-relaxed">Warning: This instantly revokes current access and forces the new cryptographic key assignment.</p>
                        <div className="space-y-4 font-mono text-sm">
                            <div>
                                <label className="block text-slate-500 mb-1 text-xs uppercase tracking-widest">New Key</label>
                                <input required type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-3" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3 text-sm font-mono font-bold">
                            <button type="button" onClick={() => setShowResetModal(null)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded">ABORT</button>
                            <button type="submit" className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 tracking-widest uppercase">EXECUTE</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
