
import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TradeHistory } from './pages/TradeHistory';
import { EquityCalendar } from './pages/EquityCalendar';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AlertGenerator } from './pages/AlertGenerator';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { Home, LineChart, Calendar, Settings as SettingsIcon, History, Terminal, LogOut, Users as UsersIcon } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const getLinkClass = (path: string) =>
    location.pathname === path ? 'nav-link-active' : 'nav-link';

  return (
    <aside className="w-64 bg-primary text-secondary-foreground h-screen fixed left-0 top-0 pt-8 flex flex-col shadow-xl z-20">
      <div className="px-6 mb-12">
        <h1 className="text-2xl font-mono font-bold tracking-tighter text-white uppercase">Tradovate Bridge</h1>
      </div>

      <nav className="flex-1 flex flex-col space-y-2">
        <Link to="/" className={getLinkClass('/')}><Home size={18} /><span>Dashboard</span></Link>
        <Link to="/generator" className={getLinkClass('/generator')}><Terminal size={18} /><span>Alert Generator</span></Link>
        <Link to="/history" className={getLinkClass('/history')}><History size={18} /><span>Trade History</span></Link>
        <Link to="/calendar" className={getLinkClass('/calendar')}><Calendar size={18} /><span>Equity Calendar</span></Link>
        <Link to="/analytics" className={getLinkClass('/analytics')}><LineChart size={18} /><span>Analytics</span></Link>
        <Link to="/settings" className={getLinkClass('/settings')}><SettingsIcon size={18} /><span>Settings</span></Link>
        <Link to="/users" className={getLinkClass('/users')}><UsersIcon size={18} /><span>System Users</span></Link>
      </nav>

      <div className="p-6">
        <button
          onClick={() => useAuthStore.getState().logout()}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded text-xs bg-red-950/20 text-red-300 font-mono hover:bg-red-950/40 transition-colors border border-red-900/30 text-center uppercase tracking-widest mt-4"
        >
          <LogOut size={14} /> Close Session
        </button>
        <div className="text-xs text-slate-500 font-mono text-center mt-4">v1.0.0 • SECURED</div>
      </div>
    </aside>
  );
};

const DashboardLayout = () => {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generator" element={<AlertGenerator />} />
            <Route path="/history" element={<TradeHistory />} />
            <Route path="/calendar" element={<EquityCalendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
