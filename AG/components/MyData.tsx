
import React, { useState, useEffect } from 'react';
import { User, Goal, Liability, IncomeItem, ExpenseItem, GoalDetails, GoalSummary, Investment } from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { Plus, Trash2, ShoppingCart, Home, Car, Utensils, Zap, Plane, Smartphone, Heart, Briefcase, IndianRupee, Target, CheckCircle2, ChevronRight, Edit2, Lightbulb, TrendingUp, GraduationCap, X, Calendar, PieChart, Coins, Loader2 } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  'Shopping': ShoppingCart,
  'Housing': Home,
  'Transport': Car,
  'Food': Utensils,
  'Utilities': Zap,
  'Travel': Plane,
  'Health': Heart,
  'Other': Smartphone
};

// --- HELPER FUNCTION FOR TIMELINE ---
const getTimeLeftString = (dueDateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate day calc
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return "Goal date reached";
  }

  if (daysLeft < 30) {
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  }

  const monthsFloat = daysLeft / 30;

  if (monthsFloat < 12) {
    const roundedDownMonths = Math.floor(monthsFloat);
    return `${roundedDownMonths} month${roundedDownMonths !== 1 ? 's' : ''} left`;
  }

  const years = Math.floor(monthsFloat / 12);
  const remainingMonths = Math.floor(monthsFloat % 12);

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''} left`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} left`;
};

const MyData = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<'Goals' | 'Income' | 'Expenses' | 'Investments'>('Goals');
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-surface border border-slate-700 rounded-xl p-1 flex space-x-1 overflow-x-auto">
        {['Goals', 'Income', 'Expenses', 'Investments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Goals' && <GoalsView />}
      {activeTab === 'Income' && <IncomeView />}
      {activeTab === 'Expenses' && <ExpensesView />}
      {activeTab === 'Investments' && <InvestmentsView />}
    </div>
  );
};

// --- GOAL MODAL COMPONENT ---
interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => void;
  initialData?: Goal | null;
}

const GoalModal = ({ isOpen, onClose, onSave, initialData }: GoalModalProps) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');

  const icons = [
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Home', icon: Home },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'Car', icon: Car },
    { name: 'Target', icon: Target },
  ];

  useEffect(() => {
    if (initialData) {
      setName(initialData.title);
      setTargetAmount(initialData.targetAmount.toString());
      setCurrentAmount(initialData.currentAmount.toString());
      setDueDate(initialData.dueDate ? initialData.dueDate.split('T')[0] : '');
      setSelectedIcon(initialData.icon);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDueDate('');
    setSelectedIcon('Briefcase');
  };

  const handleDemoData = () => {
    setName('Dream House Down Payment');
    setTargetAmount('5000000');
    setCurrentAmount('1000000');
    
    // Set date to 5 years from now
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    setDueDate(future.toISOString().split('T')[0]);
    
    setSelectedIcon('Home');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
      dueDate: dueDate || undefined,
      icon: selectedIcon,
      status: initialData ? initialData.status : 'ACTIVE'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start p-6 border-b border-slate-700">
           <div>
              <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Goal' : 'Create New Goal'}</h3>
              <p className="text-slate-400 text-sm mt-1">Define your financial goal and timeline.</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Goal Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dream House Down Payment"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-primary transition-colors placeholder-slate-500"
                required
              />
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Choose an Icon</label>
              <div className="flex space-x-3">
                 {icons.map((item) => {
                   const Icon = item.icon;
                   const isSelected = selectedIcon === item.name;
                   return (
                     <button
                       key={item.name}
                       type="button"
                       onClick={() => setSelectedIcon(item.name)}
                       className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center border transition-all ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                     >
                       <Icon size={20} />
                       <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                     </button>
                   )
                 })}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Amount</label>
                 <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500">₹</span>
                    <input 
                      type="number" 
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="50,000"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white outline-none focus:border-primary transition-colors"
                      required
                    />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Progress</label>
                 <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500">₹</span>
                    <input 
                      type="number" 
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="10,000"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white outline-none focus:border-primary transition-colors"
                    />
                 </div>
              </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Date (Timeline)</label>
              <div className="relative">
                 <Calendar className="absolute left-4 top-3 text-slate-500" size={18} />
                 <input 
                   type="date" 
                   value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)}
                   className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white outline-none focus:border-primary transition-colors [color-scheme:dark]"
                 />
              </div>
           </div>

           <div className="flex items-center justify-end space-x-3 pt-4">
               <button 
                 type="button" 
                 onClick={handleDemoData}
                 className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors"
               >
                 Demo Data (5 Years)
               </button>
               <button 
                 type="button" 
                 onClick={onClose}
                 className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 className="px-6 py-2 bg-primary hover:bg-violet-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/25 transition-all"
               >
                 {initialData ? 'Save Changes' : 'Create Goal'}
               </button>
           </div>
        </form>
      </div>
    </div>
  );
};

// --- GOALS VIEW COMPONENT ---
const GoalsView = () => {
    const [summary, setSummary] = useState<GoalSummary | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [details, setDetails] = useState<GoalDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
    useEffect(() => {
      loadSummary();
    }, []);
  
    useEffect(() => {
      if (selectedGoalId) {
        loadDetails(selectedGoalId);
      } else {
        setDetails(null);
      }
    }, [selectedGoalId]);
  
    const loadSummary = async () => {
      const data = await apiService.getGoalSummary();
      setSummary(data);
      // Select first goal by default if available and none selected
      if (data.goals.length > 0) {
          if (!selectedGoalId || !data.goals.find(g => g.id === selectedGoalId)) {
            setSelectedGoalId(data.goals[0].id);
          }
      } else {
        setSelectedGoalId(null);
        setDetails(null);
      }
    };
  
    const loadDetails = async (id: string) => {
      setLoadingDetails(true);
      try {
        const data = await apiService.getGoalDetails(id);
        setDetails(data);
      } catch (e) {
        setDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    const handleAddGoal = async (goalData: any) => {
      await apiService.addGoal(goalData);
      loadSummary();
    };

    const handleUpdateGoal = async (goalData: any) => {
      if (editingGoal) {
        await apiService.updateGoal({ ...editingGoal, ...goalData });
        loadSummary();
        // If we updated the currently selected goal, reload its details
        if (selectedGoalId === editingGoal.id) {
            loadDetails(editingGoal.id);
        }
      }
    };

    /**
     * handleDeleteGoal: Implements optimistic deletion of a goal.
     */
    const handleDeleteGoal = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      
      const confirmed = window.confirm("Are you sure you want to delete this goal? This action cannot be undone.");
      if (!confirmed) return;

      // Keep original states for potential rollback
      const originalSummary = summary;
      const originalDetails = details;
      const originalSelectedId = selectedGoalId;

      // Start loading state for the specific goal
      setDeletingGoalId(id);

      try {
        // Optimistic UI Update: Filter out the goal from the current state
        if (summary) {
          const updatedGoalsList = summary.goals.filter(g => g.id !== id);
          const updatedSummary: GoalSummary = {
            ...summary,
            totalGoals: updatedGoalsList.length,
            activeGoals: updatedGoalsList.filter(g => g.status === 'ACTIVE').length,
            completedGoals: updatedGoalsList.filter(g => g.status === 'COMPLETED').length,
            goals: updatedGoalsList
          };
          
          setSummary(updatedSummary);

          // If the deleted goal was selected, update selection logic
          if (selectedGoalId === id) {
             setDetails(null);
             if (updatedGoalsList.length > 0) {
               setSelectedGoalId(updatedGoalsList[0].id);
             } else {
               setSelectedGoalId(null);
             }
          }
        }

        // Perform actual deletion via API
        await apiService.deleteGoal(id);
        
      } catch (error) {
        console.error("Failed to delete goal:", error);
        alert("Failed to delete goal. Please try again.");
        
        // Rollback states on failure
        setSummary(originalSummary);
        setDetails(originalDetails);
        setSelectedGoalId(originalSelectedId);
      } finally {
        setDeletingGoalId(null);
      }
    };

    const openCreateModal = () => {
      setEditingGoal(null);
      setIsModalOpen(true);
    };

    const openEditModal = () => {
       if (details) {
         setEditingGoal(details.goal);
         setIsModalOpen(true);
       }
    };
  
    if (!summary) return <div className="p-8 text-center text-slate-400">Loading Goals...</div>;
  
    return (
      <div className="space-y-6">
        <GoalModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={editingGoal ? handleUpdateGoal : handleAddGoal}
          initialData={editingGoal}
        />

        {/* Top Summary Stats */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
               <h2 className="text-2xl font-bold">Financial Goals</h2>
               <p className="text-white/80">Track and manage your financial aspirations</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-white text-violet-600 px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-slate-100 transition-colors flex items-center"
            >
                <Plus size={16} className="mr-2" /> Add New Goal
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-xs uppercase font-semibold text-white/70">Total Goals</p>
                  <p className="text-3xl font-bold mt-1">{summary.totalGoals}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-xs uppercase font-semibold text-white/70">Active Goals</p>
                  <p className="text-3xl font-bold mt-1">{summary.activeGoals}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-xs uppercase font-semibold text-white/70">Completed Goals</p>
                  <p className="text-3xl font-bold mt-1">{summary.completedGoals}</p>
              </div>
          </div>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left: Goal List */}
           <div className="bg-surface border border-slate-700 rounded-2xl p-4 h-fit min-h-[300px]">
              <h3 className="text-lg font-bold text-white mb-4 px-2">Your Goals</h3>
              <div className="space-y-3">
                 {summary.goals.length === 0 && <p className="text-slate-500 text-sm px-2">No goals found. Create one to get started!</p>}
                 {summary.goals.map(goal => {
                     const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                     const isSelected = goal.id === selectedGoalId;
                     const isDeleting = deletingGoalId === goal.id;
                     return (
                         <div 
                           key={goal.id} 
                           onClick={() => setSelectedGoalId(goal.id)}
                           className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${isSelected ? 'bg-slate-700/50 border-primary' : 'bg-background border-slate-700 hover:border-slate-500'}`}
                         >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-3">
                                   <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-slate-800 text-primary'}`}>
                                      {goal.icon === 'Car' ? <Car size={18} /> : 
                                       goal.icon === 'Home' ? <Home size={18} /> : 
                                       goal.icon === 'Plane' ? <Plane size={18} /> : 
                                       goal.icon === 'GraduationCap' ? <GraduationCap size={18} /> :
                                       goal.icon === 'Briefcase' ? <Briefcase size={18} /> :
                                       <Target size={18} />}
                                   </div>
                                   <span className="font-bold text-slate-200">{goal.title}</span>
                                </div>
                                
                                <button 
                                  onClick={(e) => handleDeleteGoal(goal.id, e)}
                                  disabled={isDeleting}
                                  title="Delete Goal"
                                  className={`p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all ${isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                   {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                <div className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-500 font-medium">
                                   {goal.dueDate ? getTimeLeftString(goal.dueDate) : 'No date set'}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">{progress.toFixed(1)}%</span>
                            </div>
                         </div>
                     )
                 })}
              </div>
           </div>
  
           {/* Right: Details Panel */}
           <div className="lg:col-span-2 space-y-6">
              {!details || loadingDetails ? (
                   <div className="bg-surface border border-slate-700 rounded-2xl p-12 flex justify-center items-center h-full min-h-[400px]">
                       {loadingDetails ? <span className="text-primary animate-pulse flex items-center gap-2"><Loader2 className="animate-spin" /> Loading details...</span> : <span className="text-slate-500">Select a goal to view details</span>}
                   </div>
              ) : (
                  <>
                    <div className="bg-surface border border-slate-700 rounded-2xl p-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{details.goal.title}</h3>
                                {details.goal.dueDate && (
                                   <p className="text-sm text-slate-400 mt-1 flex items-center">
                                      <Calendar size={14} className="mr-1" />
                                      Target Date: <span className="text-white ml-1">{new Date(details.goal.dueDate).toLocaleDateString()}</span>
                                      <span className="ml-2 px-2 py-0.5 bg-slate-800 rounded text-xs text-primary font-bold">
                                        {getTimeLeftString(details.goal.dueDate)}
                                      </span>
                                   </p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                  onClick={openEditModal}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs font-medium transition-colors"
                                >
                                    <Edit2 size={14} /> <span>Edit</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteGoal(details.goal.id)}
                                  disabled={deletingGoalId === details.goal.id}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-900/20 text-rose-400 rounded-lg hover:bg-rose-900/40 text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {deletingGoalId === details.goal.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
  
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <p className="text-emerald-400 text-sm font-medium mb-1">Current Amount</p>
                                <p className="text-2xl font-bold text-white">
                                    {details.goal.currentAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                                <p className="text-indigo-400 text-sm font-medium mb-1">Target Amount</p>
                                <p className="text-2xl font-bold text-white">
                                    {details.goal.targetAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
  
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-slate-300 font-medium">Progress</p>
                                <p className="text-2xl font-bold text-primary">{details.progressPercentage.toFixed(1)}%</p>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-primary to-indigo-500 h-4 rounded-full transition-all duration-1000" 
                                  style={{ width: `${Math.min(100, details.progressPercentage)}%` }}
                                ></div>
                            </div>
                        </div>
  
                        {/* Smart Recommendations */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                           <div className="flex items-center space-x-2 mb-4">
                               <Lightbulb className="text-yellow-400" size={20} />
                               <h4 className="font-bold text-white">Smart Recommendations</h4>
                           </div>
                           <div className="space-y-3">
                               {details.recommendations.map((rec, idx) => (
                                   <div key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                                       <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0"></span>
                                       <span className="leading-relaxed">{rec}</span>
                                   </div>
                               ))}
                           </div>
                           
                           {/* Context Footer */}
                           <div className="mt-6 pt-4 border-t border-slate-700/50 flex flex-col md:flex-row justify-between text-xs text-slate-500">
                               <p>Based on parsed bank balance: <span className="text-slate-400 font-medium">₹{details.extractedBalance.toLocaleString('en-IN')}</span></p>
                               <p>Est. Monthly Free Cash: <span className="text-emerald-400 font-medium">₹{details.monthlyFreeCash.toLocaleString('en-IN')}</span></p>
                           </div>
                        </div>
                    </div>
                  </>
              )}
           </div>
        </div>
      </div>
    );
  };

// --- INCOME VIEW COMPONENT ---
const IncomeView = () => {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');

  const fetchIncomes = async () => {
    setLoading(true);
    const data = await apiService.getIncomes();
    setIncomes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !amount) return;
    
    await apiService.addIncome({
      source,
      amount: parseFloat(amount),
      frequency: 'Monthly'
    });
    
    setSource('');
    setAmount('');
    fetchIncomes(); // Refresh
  };

  const handleDelete = async (id: number) => {
    await apiService.deleteIncome(id);
    fetchIncomes();
  };

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Card */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-6 h-fit">
        <h3 className="text-lg font-bold mb-4 text-white">Add Income Source</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Source Name</label>
            <input 
              type="text" 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Salary, Freelance" 
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center">
            <Plus size={18} className="mr-2" /> Add Income
          </button>
        </form>
      </div>

      {/* List Card */}
      <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-lg font-bold text-white">Income Sources</h3>
             <p className="text-sm text-slate-400">Total: {totalIncome.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
           </div>
        </div>

        <div className="space-y-3">
          {incomes.length === 0 && !loading && <p className="text-slate-500 text-center py-4">No income sources added yet.</p>}
          {incomes.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-slate-700 group hover:border-emerald-500/50 transition-all">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-emerald-500/10 rounded-lg">
                   <Briefcase size={20} className="text-emerald-500" />
                 </div>
                 <div>
                   <p className="font-medium text-slate-200">{item.source}</p>
                   <p className="text-xs text-slate-500">{item.frequency}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-4">
                  <span className="font-bold text-emerald-400">
                    {Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- EXPENSES VIEW COMPONENT ---
const ExpensesView = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await apiService.getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    await apiService.addExpense({
      name,
      category,
      amount: parseFloat(amount),
      frequency: 'Monthly'
    });
    setName('');
    setAmount('');
    fetchExpenses();
  };

  const handleDelete = async (id: number) => {
    await apiService.deleteExpense(id);
    fetchExpenses();
  };

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-6 h-fit">
        <h3 className="text-lg font-bold mb-4 text-white">Add Expense</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Expense Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Rent" 
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
            />
          </div>
          <div>
             <label className="block text-sm text-slate-400 mb-1">Category</label>
             <select 
               value={category}
               onChange={(e) => setCategory(e.target.value)}
               className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary appearance-none"
             >
               {Object.keys(CATEGORY_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center">
            <Plus size={18} className="mr-2" /> Add Expense
          </button>
        </form>
      </div>

      {/* List */}
      <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-2xl p-6">
         <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-lg font-bold text-white">Monthly Expenses</h3>
             <p className="text-sm text-slate-400">Total: {totalExpense.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
           </div>
         </div>

         <div className="space-y-3">
          {expenses.length === 0 && !loading && <p className="text-slate-500 text-center py-4">No expenses added yet.</p>}
          {expenses.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-slate-700 group hover:border-red-500/50 transition-all">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-slate-800 rounded-lg">
                   {CATEGORY_ICONS[item.category] ? React.createElement(CATEGORY_ICONS[item.category], { size: 18, className: 'text-slate-400' }) : <ShoppingCart size={18} />}
                 </div>
                 <div>
                   <p className="font-medium text-slate-200">{item.name}</p>
                   <p className="text-xs text-slate-500">{item.category}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-4">
                  <span className="font-bold text-slate-200">
                    {Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))}
         </div>
      </div>
    </div>
  );
};

// --- INVESTMENTS VIEW COMPONENT ---
const InvestmentsView = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Stock');
  const [amount, setAmount] = useState('');

  const fetchInvestments = async () => {
    setLoading(true);
    const data = await apiService.getInvestments();
    setInvestments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    await apiService.addInvestment({
      name,
      type,
      value: parseFloat(amount),
      roi: 0 // Default to 0, user can't edit ROI in this simple view
    });
    
    setName('');
    setAmount('');
    fetchInvestments(); // Refresh list
  };

  const handleDelete = async (id: string) => {
    await apiService.deleteInvestment(id);
    fetchInvestments();
  };

  const totalValue = investments.reduce((sum, item) => sum + Number(item.value), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Card */}
      <div className="bg-surface border border-slate-700 rounded-2xl p-6 h-fit">
        <h3 className="text-lg font-bold mb-4 text-white">Add Investment</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asset Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reliance, Nifty 50" 
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
            />
          </div>
          <div>
             <label className="block text-sm text-slate-400 mb-1">Type</label>
             <select 
               value={type}
               onChange={(e) => setType(e.target.value)}
               className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary appearance-none"
             >
               <option value="Stock">Stock</option>
               <option value="Mutual Fund">Mutual Fund</option>
               <option value="Crypto">Crypto</option>
               <option value="Gold">Gold</option>
               <option value="ETF">ETF</option>
               <option value="Other">Other</option>
             </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Invested Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center">
            <Plus size={18} className="mr-2" /> Add Investment
          </button>
        </form>
      </div>

      {/* List Card */}
      <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-lg font-bold text-white">Your Portfolio</h3>
             <p className="text-sm text-slate-400">Total Value: {totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
           </div>
        </div>

        <div className="space-y-3">
          {investments.length === 0 && !loading && <p className="text-slate-500 text-center py-4">No investments added yet.</p>}
          {investments.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-slate-700 group hover:border-blue-500/50 transition-all">
               <div className="flex items-center space-x-3">
                 <div className="p-2 bg-blue-500/10 rounded-lg">
                    {item.type === 'Crypto' ? <Coins size={20} className="text-blue-500" /> : <PieChart size={20} className="text-blue-500" />}
                 </div>
                 <div>
                   <p className="font-medium text-slate-200">{item.name}</p>
                   <p className="text-xs text-slate-500">{item.type}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-4">
                  <span className="font-bold text-blue-400">
                    {Number(item.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyData;
