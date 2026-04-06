import React from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Coins,
  Briefcase
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#7c3aed', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

const Portfolio = ({ user }: { user: User }) => {
  const investments = storageService.getInvestments();
  
  // Calculate Totals
  const totalCurrentValue = investments.reduce((acc, i) => acc + i.value, 0);
  
  // Reverse engineer "Invested Amount" based on ROI for display purposes
  // Current = Invested * (1 + roi/100) -> Invested = Current / (1 + roi/100)
  const totalInvestedValue = investments.reduce((acc, i) => acc + (i.value / (1 + i.roi / 100)), 0);
  
  const totalReturns = totalCurrentValue - totalInvestedValue;
  const totalReturnsPercentage = (totalReturns / totalInvestedValue) * 100;

  // Mock Day's Gain (Randomized for demo)
  const daysGain = totalCurrentValue * 0.012; 
  const daysGainPercentage = 1.2;

  // Group by Type for Donut Chart
  const typeMap = new Map<string, number>();
  investments.forEach(inv => {
    const current = typeMap.get(inv.type) || 0;
    typeMap.set(inv.type, current + inv.value);
  });
  
  const allocationData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

  // Mock Performance Data for Area Chart
  const performanceData = [
    { name: 'Jan', value: totalCurrentValue * 0.85 },
    { name: 'Feb', value: totalCurrentValue * 0.88 },
    { name: 'Mar', value: totalCurrentValue * 0.82 },
    { name: 'Apr', value: totalCurrentValue * 0.91 },
    { name: 'May', value: totalCurrentValue * 0.94 },
    { name: 'Jun', value: totalCurrentValue * 0.98 },
    { name: 'Jul', value: totalCurrentValue },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio Overview</h1>
          <p className="text-slate-400 mt-1">Track your wealth distribution and asset performance</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors">
            Analysis
          </button>
          <button className="px-4 py-2 bg-primary hover:bg-violet-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all">
            + Add Investment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Portfolio Value" 
          value={totalCurrentValue} 
          icon={<Briefcase size={20} className="text-white" />}
          iconBg="bg-blue-500"
          trend={daysGainPercentage}
          trendLabel="today"
        />
        <SummaryCard 
          title="Invested Amount" 
          value={totalInvestedValue} 
          icon={<Wallet size={20} className="text-white" />}
          iconBg="bg-slate-600"
        />
        <SummaryCard 
          title="Total Returns" 
          value={totalReturns} 
          icon={<TrendingUp size={20} className="text-white" />}
          iconBg="bg-emerald-500"
          trend={totalReturnsPercentage}
          trendLabel="all time"
          isPnl
        />
        <SummaryCard 
          title="Day's Gain" 
          value={daysGain} 
          icon={<Coins size={20} className="text-white" />}
          iconBg="bg-primary"
          trend={daysGainPercentage}
          trendLabel="today"
          isPnl
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-100">Portfolio Growth</h3>
            <div className="flex space-x-2">
               {['1M', '6M', '1Y', 'ALL'].map(period => (
                 <button key={period} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === '6M' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                   {period}
                 </button>
               ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                   itemStyle={{ color: '#a78bfa' }}
                   formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Donut */}
        <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col">
          <h3 className="font-bold text-lg text-slate-100 mb-2">Asset Allocation</h3>
          <p className="text-sm text-slate-400 mb-6">Distribution by asset class</p>
          
          <div className="flex-1 relative min-h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={allocationData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {allocationData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                   formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                 />
               </PieChart>
             </ResponsiveContainer>
             {/* Center Text */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-bold text-white">${(totalCurrentValue / 1000).toFixed(1)}k</p>
             </div>
          </div>

          <div className="mt-6 space-y-3">
             {allocationData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                     <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-400">{((item.value / totalCurrentValue) * 100).toFixed(1)}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-surface border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
           <h3 className="font-bold text-lg text-slate-100">Your Holdings</h3>
           <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-400">Sort by:</span>
              <select className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 outline-none focus:border-primary">
                 <option>Value (High to Low)</option>
                 <option>Name (A-Z)</option>
                 <option>ROI (High to Low)</option>
              </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
               <tr>
                 <th className="px-6 py-4">Asset Name</th>
                 <th className="px-6 py-4">Price / Avg</th>
                 <th className="px-6 py-4 text-right">Invested</th>
                 <th className="px-6 py-4 text-right">Current Value</th>
                 <th className="px-6 py-4 text-right">Returns</th>
                 <th className="px-6 py-4 text-center">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
               {investments.map((inv) => {
                 const invested = inv.value / (1 + inv.roi / 100);
                 const pnl = inv.value - invested;
                 return (
                 <tr key={inv.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                             inv.type === 'Crypto' ? 'bg-orange-500/10 text-orange-500' :
                             inv.type === 'Stock' ? 'bg-blue-500/10 text-blue-500' :
                             'bg-primary/10 text-primary'
                          }`}>
                            {inv.type === 'Crypto' ? <Coins size={20} /> : <PieIcon size={20} />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-200">{inv.name}</p>
                             <p className="text-xs text-slate-500">{inv.type}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-slate-300">$--</p>
                       <p className="text-xs text-slate-500">Avg: $--</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-400">
                       ${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <p className="font-bold text-white">${inv.value.toLocaleString()}</p>
                       <p className="text-xs text-slate-500">{((inv.value / totalCurrentValue) * 100).toFixed(1)}% of portfolio</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className={`flex flex-col items-end ${inv.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span className="font-bold flex items-center">
                            {inv.roi >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded flex items-center mt-1">
                             {inv.roi >= 0 ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                             {Math.abs(inv.roi)}%
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                 </tr>
               )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  iconBg, 
  trend, 
  trendLabel, 
  isPnl = false 
}: { 
  title: string, 
  value: number, 
  icon: React.ReactNode, 
  iconBg: string, 
  trend?: number, 
  trendLabel?: string, 
  isPnl?: boolean 
}) => {
  const isPositive = trend && trend >= 0;
  
  return (
    <div className="bg-surface border border-slate-700 rounded-2xl p-5 shadow hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${iconBg} shadow-lg shadow-black/20`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
             {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
             {Math.abs(trend).toFixed(2)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h4 className={`text-2xl font-bold ${isPnl ? (value >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>
          {isPnl && value > 0 ? '+' : ''}{isPnl && value < 0 ? '-' : ''}${Math.abs(value).toLocaleString()}
        </h4>
        {trendLabel && <p className="text-xs text-slate-500 mt-1 capitalize">{trendLabel}</p>}
      </div>
    </div>
  );
}

export default Portfolio;