
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Newspaper, 
  Bot, 
  Menu, 
  X, 
  LogOut, 
  PieChart,
  BarChart4,
  Target
} from 'lucide-react';

import { storageService } from './services/storageService';
import { User } from './types';

// Page Imports
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import MyData from './components/MyData';
import MoneyPulse from './components/MoneyPulse';
import Profile from './components/Profile';

import AIAssistant from './components/AIAssistant';
import Stocks from './components/Stocks';
import GoalPlanner from './components/GoalPlanner';

const Sidebar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My Data', icon: Wallet, path: '/my-data' },
    { name: 'Financial Path', icon: Target, path: '/goal-planner' },

    { name: 'Stocks', icon: BarChart4, path: '/stocks' },
    { name: 'Money Pulse', icon: Newspaper, path: '/money-pulse' },
    { name: 'AI Assistant', icon: Bot, path: '/ai-assistant' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-surface h-screen border-r border-slate-700 sticky top-0">
      <div className="p-6 flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">I</div>
        <span className="text-2xl font-bold tracking-tight text-white">INVESTRA</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/20 text-primary border-l-4 border-primary' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div 
          onClick={() => navigate('/profile')} 
          className="flex items-center space-x-3 mb-4 px-2 cursor-pointer hover:bg-slate-700/50 rounded-lg p-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold group-hover:ring-2 ring-primary transition-all">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{user.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center space-x-2 text-slate-400 hover:text-red-400 w-full px-2 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const ProtectedLayout = ({ children, user, onLogout }: { children?: React.ReactNode, user: User, onLogout: () => void }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background text-slate-100 font-sans">
      <Sidebar user={user} onLogout={onLogout} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-surface z-50 px-4 py-3 flex justify-between items-center border-b border-slate-700">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <span className="text-xl font-bold">INVESTRA</span>
         </div>
         <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white">
           {isMobileOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-40 pt-20 px-6 space-y-4">
           <button onClick={() => { navigate('/dashboard'); setIsMobileOpen(false); }} className="block py-3 text-lg text-slate-200">Dashboard</button>
           <button onClick={() => { navigate('/path'); setIsMobileOpen(false); }} className="block py-3 text-lg text-slate-200">Financial Path</button>
           <button onClick={() => { navigate('/stocks'); setIsMobileOpen(false); }} className="block py-3 text-lg text-slate-200">Stocks</button>
           <button onClick={() => { navigate('/ai-assistant'); setIsMobileOpen(false); }} className="block py-3 text-lg text-slate-200">AI Assistant</button>
           <button onClick={() => { navigate('/profile'); setIsMobileOpen(false); }} className="block py-3 text-lg text-slate-200">My Profile</button>
           {/* Fixed: Changed 'onLogout' to 'onClick' as it is a standard HTML button element */}
           <button onClick={onLogout} className="text-red-400 block py-4 text-lg">Sign Out</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = storageService.getUser();
    if (storedUser) setUser(storedUser);
    setIsLoading(false);
  }, []);

  const handleLogin = (newUser: User) => {
    storageService.saveUser(newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background text-primary">Loading Investra...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={!user ? <AuthPage onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><Dashboard user={user} /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        <Route path="/my-data" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><MyData user={user} /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        <Route path="/money-pulse" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><MoneyPulse /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        <Route path="/profile" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><Profile /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />

        <Route path="/goal-planner" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><GoalPlanner user={user} /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        <Route path="/stocks" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><Stocks /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        <Route path="/ai-assistant" element={
          user ? <ProtectedLayout user={user} onLogout={handleLogout}><AIAssistant /></ProtectedLayout> : <Navigate to="/auth" replace />
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
