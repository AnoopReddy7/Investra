
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiService } from '../services/apiService';
import { FinancialSummary } from '../types';
import { Loader2 } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#7c3aed'];

const FinancialOverview = ({ triggerRefresh }: { triggerRefresh?: number }) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await apiService.getFinancialSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [triggerRefresh]);

  if (loading || !summary) {
    return (
      <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl h-[350px] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const chartData = [
    { name: 'Monthly Income', value: summary.monthlyIncome },
    { name: 'Monthly Expenses', value: summary.monthlyExpenses },
    { name: 'Investments', value: summary.investments },
  ];

  // Helper to format INR
  const formatINR = (val: number) => 
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-slate-100">Financial Overview</h3>
        <p className="text-sm text-slate-400">Distribution of your finances (INR)</p>
      </div>

      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="40%" // Shifted left to make room for legend
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
              formatter={(value: number) => formatINR(value)}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom Legend on the Right */}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 space-y-4 text-sm w-[45%]">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                <span className="text-slate-400 text-xs uppercase tracking-wide">{item.name}</span>
              </div>
              <span className="text-lg font-bold text-white pl-4">
                {formatINR(item.value)}
              </span>
            </div>
          ))}
          
          <div className="pt-4 border-t border-slate-700 mt-2">
             <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Net Savings</span>
                <span className="text-secondary font-bold text-sm">
                   {formatINR(summary.monthlyIncome - summary.monthlyExpenses)}
                </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;
