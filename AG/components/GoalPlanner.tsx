import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target, Plus, Trash2, Edit3, Home, GraduationCap, Car, Plane, Umbrella,
  Heart, Briefcase, Smartphone, Wallet, Shield, TrendingUp, Zap, CheckCircle2,
  AlertTriangle, XCircle, X, Save, Download, ChevronDown, ChevronUp,
  BarChart3, PiggyBank, Calendar, Info, Loader2, RefreshCw, Star
} from 'lucide-react';
import { PlannerGoal, GoalCalcResult, PlannerSettings, GoalCategory } from '../types';
import { storageService } from '../services/storageService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

// PMT = monthly contribution needed
function calcMonthlyNeeded(futureTarget: number, fvSaved: number, months: number, r: number): number {
  if (months <= 0) return Math.max(0, futureTarget - fvSaved);
  const remaining = Math.max(0, futureTarget - fvSaved);
  if (r === 0) return remaining / months;
  const factor = (Math.pow(1 + r, months) - 1) / r;
  return factor <= 0 ? remaining / months : remaining / factor;
}

function calcGoal(goal: PlannerGoal, freeCash: number): GoalCalcResult {
  const INFLATION = 0.06;
  const RATES = { conservative: 0.08, moderate: 0.12, aggressive: 0.16 };
  const months = Math.round(goal.years * 12);
  const inflationAdjustedTarget = goal.targetAmount * Math.pow(1 + INFLATION, goal.years);

  const fvOf = (r: number) =>
    goal.currentSaved * Math.pow(1 + r / 12, months);

  const fvC = fvOf(RATES.conservative);
  const fvM = fvOf(RATES.moderate);
  const fvA = fvOf(RATES.aggressive);

  const conservative = calcMonthlyNeeded(inflationAdjustedTarget, fvC, months, RATES.conservative / 12);
  const moderate = calcMonthlyNeeded(inflationAdjustedTarget, fvM, months, RATES.moderate / 12);
  const aggressive = calcMonthlyNeeded(inflationAdjustedTarget, fvA, months, RATES.aggressive / 12);

  const progressPercent = Math.min(100, (goal.currentSaved / inflationAdjustedTarget) * 100);
  const ratio = freeCash > 0 ? moderate / freeCash : 1;
  const successProbability = ratio <= 0.4 ? 95 : ratio <= 0.7 ? Math.round(95 - (ratio - 0.4) / 0.3 * 25) : Math.round(70 - (ratio - 0.7) / 0.3 * 40);
  const clampedProb = Math.min(99, Math.max(10, successProbability));

  const status: GoalCalcResult['status'] = clampedProb >= 80 ? 'On Track' : clampedProb >= 50 ? 'At Risk' : 'Delayed';

  // Chart data — month-by-month projection (sample every 3 months for performance)
  const chartData: GoalCalcResult['chartData'] = [];
  const step = Math.max(1, Math.round(months / 24));
  for (let m = 0; m <= months; m += step) {
    const proj = (r: number, pmt: number) =>
      goal.currentSaved * Math.pow(1 + r / 12, m) + pmt * ((Math.pow(1 + r / 12, m) - 1) / (r / 12));
    chartData.push({
      month: m,
      conservative: proj(RATES.conservative, conservative),
      moderate: proj(RATES.moderate, moderate),
      aggressive: proj(RATES.aggressive, aggressive),
      target: inflationAdjustedTarget,
    });
  }

  return {
    goalId: goal.id,
    inflationAdjustedTarget,
    fvOfSavings: fvM,
    monthlyNeeded: moderate,
    totalMonthsToGoal: months,
    progressPercent,
    status,
    successProbability: clampedProb,
    conservative,
    moderate,
    aggressive,
    chartData,
  };
}

// ─── Category Config ─────────────────────────────────────────────────────────
const CATEGORIES: { id: GoalCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'home', label: 'Home', icon: Home, color: '#7c3aed' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#3b82f6' },
  { id: 'car', label: 'Vehicle', icon: Car, color: '#f59e0b' },
  { id: 'travel', label: 'Travel', icon: Plane, color: '#06b6d4' },
  { id: 'retirement', label: 'Retirement', icon: Umbrella, color: '#10b981' },
  { id: 'wedding', label: 'Wedding', icon: Heart, color: '#f43f5e' },
  { id: 'business', label: 'Business', icon: Briefcase, color: '#8b5cf6' },
  { id: 'emergency', label: 'Emergency', icon: Shield, color: '#ef4444' },
  { id: 'gadget', label: 'Gadget', icon: Smartphone, color: '#64748b' },
  { id: 'other', label: 'Other', icon: Wallet, color: '#94a3b8' },
];
const getCat = (id: GoalCategory) => CATEGORIES.find(c => c.id === id) || CATEGORIES[9];

// ─── SVG Projection Chart ─────────────────────────────────────────────────────
const ProjectionChart: React.FC<{ data: GoalCalcResult['chartData']; riskProfile: string }> = ({ data, riskProfile }) => {
  const W = 400, H = 180, PAD = 30;
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.aggressive), data[data.length - 1].target) * 1.05;
  const x = (m: number) => PAD + ((m / data[data.length - 1].month) * (W - PAD * 2));
  const y = (v: number) => H - PAD - ((v / maxVal) * (H - PAD * 2));
  const path = (key: 'conservative' | 'moderate' | 'aggressive') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.month).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const targetPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.month).toFixed(1)},${y(d.target).toFixed(1)}`).join(' ');
  const active = riskProfile === 'Conservative' ? 'conservative' : riskProfile === 'Aggressive' ? 'aggressive' : 'moderate';
  const colors = { conservative: '#10b981', moderate: '#7c3aed', aggressive: '#f97316' };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[active]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors[active]} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PAD} y1={y(maxVal * f)} x2={W - PAD} y2={y(maxVal * f)}
          stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {/* Inactive scenarios */}
      {(['conservative', 'moderate', 'aggressive'] as const).filter(k => k !== active).map(k => (
        <path key={k} d={path(k)} fill="none" stroke={colors[k]} strokeWidth="1" opacity="0.25" />
      ))}
      {/* Target line */}
      <path d={targetPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" />
      {/* Area fill for active */}
      <path d={`${path(active)} L${x(data[data.length - 1].month)},${H - PAD} L${PAD},${H - PAD} Z`}
        fill="url(#chartGrad)" />
      {/* Active line */}
      <path d={path(active)} fill="none" stroke={colors[active]} strokeWidth="2.5" />
      {/* Labels */}
      <text x={W - PAD + 2} y={y(maxVal)} fontSize="7" fill="#ef4444">Target</text>
    </svg>
  );
};

// ─── Allocation Bar ───────────────────────────────────────────────────────────
const AllocationBar: React.FC<{ income: number; expenses: number; goalAlloc: number }> = ({ income, expenses, goalAlloc }) => {
  if (income <= 0) return null;
  const expPct = Math.min(100, (expenses / income) * 100);
  const goalPct = Math.min(100 - expPct, (goalAlloc / income) * 100);
  const surplusPct = Math.max(0, 100 - expPct - goalPct);
  return (
    <div className="space-y-2">
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-rose-500 transition-all duration-700" style={{ width: `${expPct}%` }} title={`Expenses ${expPct.toFixed(0)}%`} />
        <div className="bg-violet-500 transition-all duration-700" style={{ width: `${goalPct}%` }} title={`Goals ${goalPct.toFixed(0)}%`} />
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${surplusPct}%` }} title={`Surplus ${surplusPct.toFixed(0)}%`} />
      </div>
      <div className="flex gap-4 text-xs text-slate-400">
        <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Expenses {expPct.toFixed(0)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1" />Goals {goalPct.toFixed(0)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />Surplus {surplusPct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string; type: 'success' | 'error'; onDone: () => void }> = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-semibold text-sm animate-bounce-in
      ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      {msg}
    </div>
  );
};

// ─── Goal Form Modal ──────────────────────────────────────────────────────────
interface GoalFormProps {
  initial?: PlannerGoal;
  onSave: (g: PlannerGoal) => void;
  onClose: () => void;
}
const GoalFormModal: React.FC<GoalFormProps> = ({ initial, onSave, onClose }) => {
  const blank: PlannerGoal = { id: Date.now().toString(), name: '', category: 'other', targetAmount: 0, currentSaved: 0, years: 5, priority: 'Medium', createdAt: new Date().toISOString() };
  const [form, setForm] = useState<PlannerGoal>(initial || blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (f: Partial<PlannerGoal>) => setForm(p => ({ ...p, ...f }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Goal name is required';
    if (form.targetAmount <= 0) e.targetAmount = 'Target amount must be positive';
    if (form.currentSaved < 0) e.currentSaved = 'Cannot be negative';
    if (form.currentSaved > form.targetAmount) e.currentSaved = 'Saved cannot exceed target';
    if (form.years <= 0 || form.years > 50) e.years = 'Years must be between 1 and 50';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSave({ ...form, id: form.id || Date.now().toString() }); };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-violet-400" size={22} />
            {initial ? 'Edit Goal' : 'Add New Goal'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Category Picker */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const sel = form.category === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => set({ category: c.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${sel ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}>
                    <Icon size={18} style={{ color: sel ? c.color : undefined }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Name */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Goal Name *</label>
            <input value={form.name} onChange={e => set({ name: e.target.value })}
              placeholder="e.g. Dream Home Down Payment"
              className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.name ? 'border-rose-500' : 'border-slate-600'}`} />
            {errors.name && <p className="text-rose-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} />{errors.name}</p>}
          </div>

          {/* Target & Saved */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Target Amount (₹) *</label>
              <input type="number" min="0" value={form.targetAmount || ''} onChange={e => set({ targetAmount: parseFloat(e.target.value) || 0 })}
                placeholder="5000000"
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.targetAmount ? 'border-rose-500' : 'border-slate-600'}`} />
              {form.targetAmount > 0 && <p className="text-slate-500 text-xs mt-1">{fmt(form.targetAmount)}</p>}
              {errors.targetAmount && <p className="text-rose-400 text-xs mt-1"><AlertTriangle size={12} className="inline" /> {errors.targetAmount}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Already Saved (₹)</label>
              <input type="number" min="0" value={form.currentSaved || ''} onChange={e => set({ currentSaved: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.currentSaved ? 'border-rose-500' : 'border-slate-600'}`} />
              {errors.currentSaved && <p className="text-rose-400 text-xs mt-1"><AlertTriangle size={12} className="inline" /> {errors.currentSaved}</p>}
            </div>
          </div>

          {/* Years & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Time Horizon (Years) *</label>
              <input type="number" min="1" max="50" value={form.years || ''} onChange={e => set({ years: parseInt(e.target.value) || 1 })}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-violet-500 text-center text-xl font-bold transition-all ${errors.years ? 'border-rose-500' : 'border-slate-600'}`} />
              {errors.years && <p className="text-rose-400 text-xs mt-1"><AlertTriangle size={12} className="inline" /> {errors.years}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Priority</label>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map(p => (
                  <button key={p} type="button" onClick={() => set({ priority: p })}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${form.priority === p
                      ? p === 'High' ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : p === 'Medium' ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl font-semibold transition-all hover:border-slate-400">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2">
            <Save size={16} /> {initial ? 'Save Changes' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{ msg: string; onConfirm: () => void; onCancel: () => void }> = ({ msg, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-5">
      <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
        <Trash2 className="text-rose-400" size={28} />
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">Delete Goal</h3>
        <p className="text-slate-400 text-sm mt-1">{msg}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 border border-slate-600 text-slate-400 hover:text-white rounded-xl font-semibold transition-all">Keep It</button>
        <button onClick={onConfirm} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all">Delete</button>
      </div>
    </div>
  </div>
);

// ─── Goal Card ────────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: PlannerGoal;
  calc: GoalCalcResult;
  riskProfile: string;
  onEdit: () => void;
  onDelete: () => void;
}
const GoalCard: React.FC<GoalCardProps> = ({ goal, calc, riskProfile, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [barW, setBarW] = useState(0);
  const cat = getCat(goal.category);
  const Icon = cat.icon;

  useEffect(() => {
    const t = setTimeout(() => setBarW(calc.progressPercent), 100);
    return () => clearTimeout(t);
  }, [calc.progressPercent]);

  const probColor = calc.successProbability >= 80 ? 'text-emerald-400' : calc.successProbability >= 50 ? 'text-amber-400' : 'text-rose-400';
  const statusBg = calc.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : calc.status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  const barColor = calc.progressPercent >= 70 ? 'bg-emerald-500' : calc.progressPercent >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const priorityColor = goal.priority === 'High' ? 'text-rose-400' : goal.priority === 'Medium' ? 'text-amber-400' : 'text-emerald-400';

  const activeMonthly = riskProfile === 'Conservative' ? calc.conservative : riskProfile === 'Aggressive' ? calc.aggressive : calc.moderate;

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl overflow-hidden hover:border-violet-500/40 transition-all duration-300 group">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
              <Icon size={22} style={{ color: cat.color }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">{goal.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 text-xs">{cat.label}</span>
                <span className="text-slate-700">·</span>
                <span className={`text-xs font-semibold ${priorityColor}`}>{goal.priority}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${statusBg}`}>{calc.status}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Monthly Needed</p>
            <p className="text-white font-black text-sm">{fmt(activeMonthly)}</p>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target</p>
            <p className="text-white font-black text-sm">{fmt(calc.inflationAdjustedTarget)}</p>
            <p className="text-slate-600 text-[9px]">inflation adj.</p>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Timeline</p>
            <p className="text-white font-black text-sm">{goal.years}Y</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span className="font-bold text-white">{calc.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${barW}%`, boxShadow: `0 0 8px ${cat.color}60` }} />
          </div>
          <div className="flex justify-between text-xs mt-1 text-slate-600">
            <span>{fmt(goal.currentSaved)} saved</span>
            <span>{fmt(calc.inflationAdjustedTarget)}</span>
          </div>
        </div>

        {/* Probability badge */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Star size={14} className={probColor} />
            <span className="text-xs text-slate-400">Success Probability</span>
          </div>
          <span className={`text-sm font-black ${probColor}`}>{calc.successProbability}%</span>
        </div>
      </div>

      {/* Expand Toggle */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-slate-500 hover:text-violet-400 bg-slate-800/30 transition-colors border-t border-slate-800">
        {expanded ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> Show Scenarios & Chart</>}
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="p-5 border-t border-slate-800 space-y-5">
          {/* 3-Scenario Table */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Monthly Contribution by Risk</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Conservative', val: calc.conservative, color: 'emerald', rate: '8%' },
                { label: 'Moderate', val: calc.moderate, color: 'violet', rate: '12%' },
                { label: 'Aggressive', val: calc.aggressive, color: 'orange', rate: '16%' },
              ].map(s => {
                const isActive = (riskProfile === 'Conservative' && s.label === 'Conservative') ||
                  (riskProfile === 'Moderate' && s.label === 'Moderate') ||
                  (riskProfile === 'Aggressive' && s.label === 'Aggressive');
                return (
                  <div key={s.label}
                    className={`rounded-xl p-3 text-center border transition-all ${isActive ? `border-${s.color}-500 bg-${s.color}-500/10` : 'border-slate-700 bg-slate-800/50'}`}>
                    <p className="text-[10px] text-slate-500 mb-1">{s.label} ({s.rate})</p>
                    <p className={`font-black text-sm ${isActive ? `text-${s.color}-400` : 'text-slate-300'}`}>{fmt(s.val)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projection Chart */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Savings Projection</p>
            <div className="bg-slate-900/50 rounded-2xl p-3">
              <ProjectionChart data={calc.chartData} riskProfile={riskProfile} />
              <div className="flex justify-center gap-4 mt-1 text-[10px] text-slate-500">
                <span><span className="text-emerald-400">—</span> Conservative</span>
                <span><span className="text-violet-400">—</span> Moderate</span>
                <span><span className="text-orange-400">—</span> Aggressive</span>
                <span><span className="text-rose-400">- -</span> Target</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="flex border-t border-slate-800">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-violet-400 hover:bg-violet-500/5 transition-all text-sm font-medium">
          <Edit3 size={15} /> Edit
        </button>
        <div className="w-px bg-slate-800" />
        <button onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-sm font-medium">
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  );
};

// ─── Main GoalPlanner ─────────────────────────────────────────────────────────
interface GoalPlannerProps { user?: { fullName: string } }

const GoalPlanner: React.FC<GoalPlannerProps> = ({ user }) => {
  const [goals, setGoals] = useState<PlannerGoal[]>(() => storageService.getPlannerGoals());
  const [settings, setSettings] = useState<PlannerSettings>(() => storageService.getPlannerSettings());
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<PlannerGoal | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(goals.length === 0);

  const freeCash = Math.max(0, settings.monthlyIncome - settings.monthlyExpenses);

  // All calculations derived from goals + settings
  const calcs = goals.map(g => calcGoal(g, freeCash));
  const totalMonthlyNeeded = calcs.reduce((s, c) => {
    const v = settings.riskProfile === 'Conservative' ? c.conservative : settings.riskProfile === 'Aggressive' ? c.aggressive : c.moderate;
    return s + v;
  }, 0);
  const onTrackCount = calcs.filter(c => c.status === 'On Track').length;
  const avgProb = calcs.length ? Math.round(calcs.reduce((s, c) => s + c.successProbability, 0) / calcs.length) : 0;

  const riskOptions = [
    { id: 'Conservative' as const, label: 'Conservative', rate: '8% p.a.', Icon: Shield, color: '#10b981' },
    { id: 'Moderate' as const, label: 'Moderate', rate: '12% p.a.', Icon: TrendingUp, color: '#7c3aed' },
    { id: 'Aggressive' as const, label: 'Aggressive', rate: '16% p.a.', Icon: Zap, color: '#f97316' },
  ];

  const setSetting = (f: Partial<PlannerSettings>) => setSettings(p => ({ ...p, ...f }));

  const handleSaveGoal = (g: PlannerGoal) => {
    const updated = editGoal ? goals.map(x => x.id === g.id ? g : x) : [...goals, g];
    setGoals(updated);
    storageService.savePlannerGoals(updated);
    setShowForm(false);
    setEditGoal(undefined);
    setToast({ msg: editGoal ? 'Goal updated!' : 'Goal added!', type: 'success' });
  };

  const handleDelete = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    storageService.savePlannerGoals(updated);
    setDeleteId(null);
    setToast({ msg: 'Goal removed.', type: 'success' });
  };

  const handleSavePlan = async () => {
    setSaving(true);
    storageService.savePlannerGoals(goals);
    storageService.savePlannerSettings(settings);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setToast({ msg: 'Plan saved to your device!', type: 'success' });
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 print:space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Financial <span className="text-violet-400">Path</span>
          </h1>
          <p className="text-slate-400 mt-1">Map every financial dream to a concrete monthly action.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={handleSavePlan} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-all">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Plan
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-all">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Goals', val: goals.length, Icon: Target, color: 'violet' },
            { label: 'On Track', val: `${onTrackCount}/${goals.length}`, Icon: CheckCircle2, color: 'emerald' },
            { label: 'Monthly Needed', val: fmt(totalMonthlyNeeded), Icon: PiggyBank, color: 'violet' },
            { label: 'Avg. Success', val: `${avgProb}%`, Icon: BarChart3, color: avgProb >= 80 ? 'emerald' : avgProb >= 50 ? 'amber' : 'rose' },
          ].map(s => {
            const Icon = s.Icon;
            return (
              <div key={s.label} className="bg-[#1e293b] border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-500/10`}>
                  <Icon size={20} className={`text-${s.color}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{s.val}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Settings Panel ── */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-3xl overflow-hidden">
        <button onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-violet-400" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold">Financial Settings & Risk Profile</h2>
              <p className="text-slate-500 text-sm">Income: {fmt(settings.monthlyIncome)}/mo · Free Cash: {fmt(freeCash)}/mo · Risk: {settings.riskProfile}</p>
            </div>
          </div>
          {showSettings ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
        </button>

        {showSettings && (
          <div className="p-6 pt-0 space-y-6 border-t border-slate-800">
            {/* Income & Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Monthly Income (₹)</label>
                <input type="number" min="0" value={settings.monthlyIncome || ''}
                  onChange={e => setSetting({ monthlyIncome: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 100000"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-xl font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                {settings.monthlyIncome > 0 && <p className="text-slate-500 text-xs mt-1">{fmt(settings.monthlyIncome)} per month</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Monthly Expenses (₹)</label>
                <input type="number" min="0" value={settings.monthlyExpenses || ''}
                  onChange={e => setSetting({ monthlyExpenses: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-xl font-bold outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                {settings.monthlyExpenses > 0 && <p className="text-slate-500 text-xs mt-1">{fmt(settings.monthlyExpenses)} per month</p>}
              </div>
            </div>

            {/* Free Cash Meter */}
            {settings.monthlyIncome > 0 && (
              <div className="bg-slate-900/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Income Allocation</span>
                  <span className="text-sm text-emerald-400 font-bold">Free Cash: {fmt(freeCash)}/mo</span>
                </div>
                <AllocationBar income={settings.monthlyIncome} expenses={settings.monthlyExpenses} goalAlloc={totalMonthlyNeeded} />
              </div>
            )}

            {/* Risk Profile */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Investment Strategy</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {riskOptions.map(r => {
                  const RIcon = r.Icon;
                  const sel = settings.riskProfile === r.id;
                  return (
                    <button key={r.id} onClick={() => setSetting({ riskProfile: r.id })}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${sel ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${r.color}20` }}>
                        <RIcon size={20} style={{ color: r.color }} />
                      </div>
                      <div>
                        <p className={`font-bold ${sel ? 'text-white' : 'text-slate-300'}`}>{r.label}</p>
                        <p className="text-xs text-slate-500">{r.rate} returns</p>
                      </div>
                      {sel && <CheckCircle2 className="ml-auto text-violet-400 flex-shrink-0" size={18} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Goals Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-violet-400" size={22} /> Your Goals
            {goals.length > 0 && <span className="text-sm font-medium text-slate-500 ml-1">({goals.length})</span>}
          </h2>
          <button onClick={() => { setEditGoal(undefined); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/30 text-sm">
            <Plus size={18} /> Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          /* Empty State */
          <div className="bg-[#1e293b] border border-dashed border-slate-600 rounded-3xl p-16 text-center space-y-5">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="text-violet-400" size={36} />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">No goals yet</h3>
              <p className="text-slate-400 mt-2 max-w-sm mx-auto">Start by adding your first financial goal — whether it's a home, education, or retirement fund.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.slice(0, 5).map(c => {
                const CIcon = c.icon;
                return (
                  <button key={c.id} onClick={() => { setEditGoal(undefined); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-slate-300 transition-all">
                    <CIcon size={16} style={{ color: c.color }} />{c.label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setEditGoal(undefined); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-violet-500/30">
              <Plus size={20} /> Add Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {goals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} calc={calcs[i]} riskProfile={settings.riskProfile}
                onEdit={() => { setEditGoal(goal); setShowForm(true); }}
                onDelete={() => setDeleteId(goal.id)} />
            ))}
            {/* Add another card shortcut */}
            <button onClick={() => { setEditGoal(undefined); setShowForm(true); }}
              className="border-2 border-dashed border-slate-700 hover:border-violet-500/50 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-violet-400 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-violet-500/10 flex items-center justify-center transition-all">
                <Plus size={24} />
              </div>
              <span className="text-sm font-semibold">Add Another Goal</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Panel ── */}
      {goals.length > 0 && settings.monthlyIncome > 0 && (
        <div className="bg-gradient-to-br from-violet-900/30 to-slate-900/50 border border-violet-500/20 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Info className="text-violet-400" size={20} />
            </div>
            <h2 className="text-white font-bold text-lg">Plan Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Income', val: fmt(settings.monthlyIncome), note: 'Total earnings' },
              { label: 'Monthly Expenses', val: fmt(settings.monthlyExpenses), note: 'Fixed costs' },
              { label: 'Goal Contributions', val: fmt(totalMonthlyNeeded), note: `${settings.riskProfile} strategy` },
              { label: 'Remaining Surplus', val: fmt(Math.max(0, freeCash - totalMonthlyNeeded)), note: 'After all goals' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/40 rounded-2xl p-4">
                <p className="text-xs text-slate-500 font-semibold mb-1">{s.label}</p>
                <p className="text-white text-xl font-black">{s.val}</p>
                <p className="text-slate-600 text-xs mt-0.5">{s.note}</p>
              </div>
            ))}
          </div>
          {totalMonthlyNeeded > freeCash && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-amber-200 font-semibold text-sm">Budget shortfall detected</p>
                <p className="text-amber-300/70 text-xs mt-1">
                  You need {fmt(totalMonthlyNeeded)} but only have {fmt(freeCash)} free cash.
                  Consider extending timelines, switching to Aggressive strategy, or reducing targets.
                </p>
              </div>
            </div>
          )}
          {totalMonthlyNeeded <= freeCash && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-emerald-200 text-sm">
                <span className="font-bold">You're on track! </span>
                All goals fit within your budget with {fmt(Math.max(0, freeCash - totalMonthlyNeeded))} to spare each month.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <GoalFormModal initial={editGoal}
          onSave={handleSaveGoal}
          onClose={() => { setShowForm(false); setEditGoal(undefined); }} />
      )}
      {deleteId && (
        <ConfirmDialog msg="Are you sure you want to remove this goal? This cannot be undone."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
};

export default GoalPlanner;
