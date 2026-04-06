import React, { useEffect, useState } from 'react';
import { User, FinancialSummary } from '../types';
import { Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import MarketTicker from './MarketTicker';
import FinancialOverview from './FinancialOverview';

type Indices = {
  nifty50: { value: number; change: number; percent: number };
  sensex: { value: number; change: number; percent: number };
  niftyFinancial: { value: number; change: number; percent: number };
  bankNifty: { value: number; change: number; percent: number };
};

const Dashboard = ({ user: initialUser }: { user: User }) => {

  const [user, setUser] = useState<User>(initialUser);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [indices, setIndices] = useState<Indices | null>(null);

  // Fetch Market Indices
  const fetchIndices = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/indices");
      const data = await res.json();

      console.log("Market API Response:", data);

      setIndices(data);
    } catch (err) {
      console.error("Failed to fetch indices", err);
    }
  };
  useEffect(() => {

    // refresh user balance
    const latestUser = storageService.getUser();
    if (latestUser) {
      setUser(latestUser);
    }

    const fetchSummary = async () => {
      try {
        const data = await apiService.getFinancialSummary();
        setSummary(data);
      } catch (e) {
        console.error("Failed to fetch summary", e);
      }
    };

    fetchSummary();

    // First fetch for indices
    fetchIndices();

    // Live refresh every 5 seconds
    const interval = setInterval(() => {
      fetchIndices();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  const totalInvestments = storageService
    .getInvestments()
    .reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-rose-500 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle2 className="text-white/80" />
            <h1 className="text-3xl font-bold">
              Welcome to INVESTRA, {user.fullName.split(' ')[0]}! 🎉
            </h1>
          </div>

          <p className="text-white/90 max-w-3xl">
            Your account has been created successfully. Start exploring your
            financial dashboard and take control of your investments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 bg-white/10 backdrop-blur-md rounded-xl p-4">
            <div>
              <p className="text-xs text-white/70 uppercase">Full Name</p>
              <p className="font-semibold">{user.fullName}</p>
            </div>

            <div>
              <p className="text-xs text-white/70 uppercase">Email</p>
              <p className="font-semibold truncate">{user.email}</p>
            </div>

            <div>
              <p className="text-xs text-white/70 uppercase">Phone</p>
              <p className="font-semibold">{user.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Ticker */}
      <MarketTicker indices={indices} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Wealth Card */}
        <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl">

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium text-slate-300">My Wealth</h3>

              <p className="text-4xl font-bold text-white mt-2">
                {user.balance.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                })}
              </p>

              <div className="flex items-center text-secondary text-sm mt-2 font-medium">
                <TrendingUp size={16} className="mr-1" />
                <span>+62.5% vs last month</span>
              </div>
            </div>

            <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600">
              <Wallet className="text-primary" size={24} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">

            <div className="bg-background/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Monthly Expenses</p>
              <p className="text-xl font-bold text-red-400">
                {summary
                  ? summary.monthlyExpenses.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })
                  : '...'}
              </p>
            </div>

            <div className="bg-background/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Investments</p>
              <p className="text-xl font-bold text-primary">
                {totalInvestments.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR'
                })}
              </p>
            </div>

            <div className="bg-background/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-1">Monthly Income</p>
              <p className="text-xl font-bold text-emerald-400">
                {summary
                  ? summary.monthlyIncome.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })
                  : '...'}
              </p>
            </div>

          </div>
        </div>

        {/* Financial Chart */}
        <FinancialOverview />

      </div>
    </div>
  );
};

export default Dashboard;