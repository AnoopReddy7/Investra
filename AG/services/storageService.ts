
import { User, Goal, Transaction, Liability, Investment, PlannerGoal, PlannerSettings } from '../types';

const KEYS = {
  USER: 'investra_user',
  ACCOUNTS: 'investra_accounts', // For storing multiple registered accounts
  GOALS: 'investra_goals',
  TRANSACTIONS: 'investra_transactions',
  LIABILITIES: 'investra_liabilities',
  INVESTMENTS: 'investra_investments',
  PLANNER_GOALS: 'investra_planner_goals',
  PLANNER_SETTINGS: 'investra_planner_settings',
};

// Initial Mock Data
const DEFAULT_GOALS: Goal[] = [
  { 
    id: '1', 
    title: 'New Car', 
    targetAmount: 800000, 
    currentAmount: 150000, 
    icon: 'Car',
    dueDate: '2025-12-31',
    status: 'ACTIVE'
  },
  { 
    id: '2', 
    title: 'Dream Home', 
    targetAmount: 5000000, 
    currentAmount: 1200000, 
    icon: 'Home',
    dueDate: '2030-01-01',
    status: 'ACTIVE'
  },
  { 
    id: '3', 
    title: 'Europe Trip', 
    targetAmount: 250000, 
    currentAmount: 250000, 
    icon: 'Plane',
    dueDate: '2024-06-01',
    status: 'COMPLETED'
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Salary', amount: 8000, category: 'Salary', type: 'income', date: '2024-05-01' },
  { id: '2', title: 'Monthly Rent', amount: 1200, category: 'Housing', type: 'expense', date: '2024-05-03' },
  { id: '3', title: 'Grocery Run', amount: 350, category: 'Food', type: 'expense', date: '2024-05-05' },
];

const DEFAULT_LIABILITIES: Liability[] = [
  { id: '1', title: 'Student Loan', totalAmount: 20000, interestRate: 4.5, dueDate: '2028-01-01' }
];

const DEFAULT_INVESTMENTS: Investment[] = [
  { id: '1', name: 'S&P 500 ETF', type: 'ETF', value: 14500, roi: 12.4 },
  { id: '2', name: 'Nvidia Corp', type: 'Stock', value: 8400, roi: 45.2 },
  { id: '3', name: 'Tech Growth Fund', type: 'Mutual Fund', value: 5000, roi: 8.1 },
  { id: '4', name: 'Bitcoin', type: 'Crypto', value: 3200, roi: 15.6 },
  { id: '5', name: 'Gold Bees', type: 'Commodity', value: 1500, roi: 4.2 },
  { id: '6', name: 'Reliance Ind', type: 'Stock', value: 4200, roi: -2.5 },
  { id: '7', name: 'HDFC Bank', type: 'Stock', value: 2800, roi: 5.4 },
];

export const storageService = {
  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user: User) => localStorage.setItem(KEYS.USER, JSON.stringify(user)),
  logout: () => localStorage.removeItem(KEYS.USER),

  // Account registry for signup/signin
  getAccounts: (): any[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  saveAccounts: (accounts: any[]) => localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts)),

  getGoals: (): Goal[] => {
    const data = localStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : DEFAULT_GOALS;
  },
  saveGoals: (goals: Goal[]) => localStorage.setItem(KEYS.GOALS, JSON.stringify(goals)),

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : DEFAULT_TRANSACTIONS;
  },
  saveTransactions: (txs: Transaction[]) => localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs)),

  getLiabilities: (): Liability[] => {
    const data = localStorage.getItem(KEYS.LIABILITIES);
    return data ? JSON.parse(data) : DEFAULT_LIABILITIES;
  },
  saveLiabilities: (libs: Liability[]) => localStorage.setItem(KEYS.LIABILITIES, JSON.stringify(libs)),
  
  getInvestments: (): Investment[] => {
    const data = localStorage.getItem(KEYS.INVESTMENTS);
    return data ? JSON.parse(data) : DEFAULT_INVESTMENTS;
  },
  saveInvestments: (investments: Investment[]) => localStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(investments)),

  // Goal Planner
  getPlannerGoals: (): PlannerGoal[] => {
    const data = localStorage.getItem(KEYS.PLANNER_GOALS);
    return data ? JSON.parse(data) : [];
  },
  savePlannerGoals: (goals: PlannerGoal[]) => localStorage.setItem(KEYS.PLANNER_GOALS, JSON.stringify(goals)),

  getPlannerSettings: (): PlannerSettings => {
    const data = localStorage.getItem(KEYS.PLANNER_SETTINGS);
    return data ? JSON.parse(data) : { monthlyIncome: 0, monthlyExpenses: 0, riskProfile: 'Moderate', inflationRate: 0.06 };
  },
  savePlannerSettings: (settings: PlannerSettings) => localStorage.setItem(KEYS.PLANNER_SETTINGS, JSON.stringify(settings)),
};
