
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  balance: number; // Extracted from Bank Statement
  bankStatementName?: string;
  lastUpdated?: string;
}

export interface UserProfile extends User {
  firstName: string;
  lastName: string;
  location: string;
  dob: string;
  photoUrl?: string;
}

export interface BankStatementMetadata {
  fileName: string;
  uploadedAt: string;
  extractedBalance: number;
  fileUrl?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string; // lucide icon name
  dueDate?: string; // ISO Date string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  goals: Goal[];
}

export interface GoalDetails {
  goal: Goal;
  // Context
  extractedBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  activeCommitments: number;
  safetyBuffer: number;
  
  // Computed Cash Flow
  lumpSumFreeCash: number;
  monthlyFreeCash: number;
  
  // Goal Specifics
  remainingAmount: number;
  monthsLeft: number;
  
  // Recommendations
  idealMonthlyContribution: number;
  recommendedMonthlyContribution: number;
  boostContribution: number;
  progressPercentage: number;
  recommendations: string[];
}

// --- GOAL PLANNER TYPES ---
export type GoalCategory = 'home' | 'education' | 'car' | 'travel' | 'retirement' | 'emergency' | 'wedding' | 'business' | 'gadget' | 'other';

export interface PlannerGoal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;       // today's value in INR
  currentSaved: number;       // already saved
  years: number;              // time horizon
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;          // ISO date
}

export interface GoalCalcResult {
  goalId: string;
  inflationAdjustedTarget: number;  // target inflated at 6% p.a.
  fvOfSavings: number;              // future value of currentSaved at selected rate
  monthlyNeeded: number;            // PMT needed
  totalMonthsToGoal: number;
  progressPercent: number;          // currentSaved / inflated target %
  status: 'On Track' | 'At Risk' | 'Delayed';
  successProbability: number;       // 0–100
  // Three-scenario monthly amounts
  conservative: number;
  moderate: number;
  aggressive: number;
  // Chart data: month → projected accumulated value
  chartData: { month: number; conservative: number; moderate: number; aggressive: number; target: number }[];
}

export interface PlannerSettings {
  monthlyIncome: number;
  monthlyExpenses: number;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  inflationRate: number;  // default 0.06
}

// --- FINANCIAL PATH TYPES ---
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

export interface PathGoalInput {
  id: string;
  name: string;
  targetToday: number;
  years: number;
  currentAmount: number;
}

export interface PathGoalResult {
  id: string;
  name: string;
  targetToday: number;
  futureTarget: number; // Inflation adjusted
  years: number;
  monthsLeft: number;
  currentAmount: number;
  lumpSumApplied: number;
  remainingNeeded: number;
  idealMonthly: number;
  recommendedMonthly: number;
  shortfall: boolean;
  estimatedCompletionDate: string;
  status: 'On Track' | 'At Risk' | 'Delayed';
}

export interface TimelinePoint {
  month: number;
  date: string;
  label: string;
  cumulativeTarget: number; // The "Need" line
  projectedPortfolio: number; // The "Have" line (Risk based)
  milestones: PathGoalResult[]; // Goals completed at this point
}

export interface FinancialPathSummary {
  monthlyFreeCash: number;
  usableLumpSum: number;
  monthlyGoalBudget: number;
  totalIdealMonthly: number;
  totalRecommendedMonthly: number;
  riskProfile: RiskProfile;
  projectedReturns: number; // e.g. 0.12 for 12%
  recommendations: string[];
}

export interface FinancialPathResponse {
  goals: PathGoalResult[];
  timeline: TimelinePoint[];
  summary: FinancialPathSummary;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export interface Liability {
  id: string;
  title: string;
  totalAmount: number;
  interestRate: number;
  dueDate: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  value: number;
  roi: number;
}

export interface Article {
  title: string;
  source: string;
  category: string;
  publishedAt: string;
  description: string;
  url: string;
  imageUrl: string;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  percent: number;
}

export interface MarketData {
  nifty50: MarketIndex;
  sensex: MarketIndex;
  niftyFinService: MarketIndex;
  bankex: MarketIndex;
}

// --- STOCKS & RECOMMENDATIONS ---
export interface StockRecommendation {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  expectedReturn: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  reasoning: string;
  type: 'Stock' | 'ETF' | 'Mutual Fund' | 'Index' | 'VIX';
}

export interface MarketSentiment {
  trend: 'Bullish' | 'Neutral' | 'Bearish';
  riskIndicator: string;
  fiiFlow: number; // in Crores
  diiFlow: number; // in Crores
}

// New Types for Backend Integration
export interface IncomeItem {
  id: number;
  source: string;
  amount: number;
  frequency: string;
}

export interface ExpenseItem {
  id: number;
  name: string;
  category: string;
  amount: number;
  frequency: string;
}

export interface FinancialSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  investments: number;
  debts: number;
}

export enum ViewState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  DASHBOARD = 'DASHBOARD',
  MY_DATA = 'MY_DATA',
  MONEY_PULSE = 'MONEY_PULSE',
  AI_ASSISTANT = 'AI_ASSISTANT',
  STOCKS = 'STOCKS'
}
