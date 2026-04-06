
import { MarketData, Article, IncomeItem, ExpenseItem, FinancialSummary, UserProfile, BankStatementMetadata, GoalSummary, GoalDetails, Goal, RiskProfile, FinancialPathResponse, PathGoalInput, PathGoalResult, TimelinePoint, Investment, StockRecommendation, MarketSentiment } from '../types';
import { storageService } from './storageService';
import { analyzeBankStatement } from './geminiService';

const API_BASE_URL = 'http://localhost:5000/api';
const FINNHUB_KEY = 'd6i6709r01ql9cif3e20d6i6709r01ql9cif3e2g';

// --- IN-MEMORY STATE FOR MOCK FALLBACK ---
let mockIncomes: IncomeItem[] = [
  { id: 1, source: 'Salary', amount: 80000, frequency: 'Monthly' },
  { id: 2, source: 'Freelance', amount: 15000, frequency: 'Monthly' }
];

let mockExpenses: ExpenseItem[] = [
  { id: 1, name: 'Rent', category: 'Housing', amount: 25000, frequency: 'Monthly' },
  { id: 2, name: 'Groceries', category: 'Food', amount: 8000, frequency: 'Monthly' },
  { id: 3, name: 'Travel', category: 'Transport', amount: 4000, frequency: 'Monthly' }
];

// Mock Profile State
let mockProfileData: Partial<UserProfile> = {
  location: 'Hyderabad, India',
  dob: '1995-08-15'
};

// Caching logic for market indices
let indicesCache: {
  data: MarketData | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_DURATION = 30000; // Reduced to 30s for more frequent updates

// Initial Base Values for Market (Fallback)
let currentIndices: MarketData = {
  nifty50: { name: 'NIFTY 50', value: 22450.60, change: 125.40, percent: 0.56 },
  sensex: { name: 'SENSEX', value: 73900.25, change: 350.10, percent: 0.48 },
  niftyFinService: { name: 'NIFTY FINANCIAL SERVICES', value: 21840.2, change: -92.4, percent: -0.42 },
  bankex: { name: 'BSE BANKEX', value: 52134.9, change: 210.6, percent: 0.40 }
};

const simulateMarketMovement = () => {
  const keys = Object.keys(currentIndices) as Array<keyof MarketData>;
  keys.forEach(key => {
    // Apply a small random movement (0.01% to 0.05%) to simulate "live" ticks
    const volatility = 0.0003;
    const direction = Math.random() > 0.48 ? 1 : -1; // Slight upward bias
    const movementPercent = (Math.random() * volatility) * direction;
    const movementAmount = currentIndices[key].value * movementPercent;

    currentIndices[key] = {
      ...currentIndices[key],
      value: parseFloat((currentIndices[key].value + movementAmount).toFixed(2)),
      change: parseFloat((currentIndices[key].change + movementAmount).toFixed(2)),
      percent: parseFloat((currentIndices[key].percent + (movementPercent * 100)).toFixed(2))
    };
  });
  return { ...currentIndices };
};

const MOCK_NEWS: Article[] = [
  {
    title: 'RBI keeps repo rate unchanged at 6.5%',
    source: 'Economic Times',
    category: 'Policy',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    description: 'The Monetary Policy Committee decided to keep the policy repo rate unchanged.',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Sensex hits all-time high',
    source: 'MarketWatch',
    category: 'Markets',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    description: 'Indian benchmark indices reached fresh lifetime highs on Monday.',
    url: '#',
    imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80&w=800'
  }
];

let stocksCache: {
  data: StockRecommendation[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

let currentStocks: StockRecommendation[] = [
  { symbol: '^NSEI', name: 'NIFTY 50', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'Top 50 large-cap benchmark.', type: 'Index' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Banking sector index.', type: 'Index' },
  { symbol: 'NIFTY_FIN_SERVICE.NS', name: 'FINNIFTY', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Financial services index.', type: 'Index' },
  { symbol: '^BSESN', name: 'SENSEX', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'BSE top 30 companies.', type: 'Index' },
  { symbol: 'NIFTY_MIDCAP_50.NS', name: 'Nifty Midcap Select', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Select midcap companies.', type: 'Index' },
  { symbol: 'BSE-BANK.BO', name: 'BANKEX', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'BSE Banking index.', type: 'Index' },
  { symbol: '^INDIAVIX', name: 'India Vix', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Market volatility indicator.', type: 'VIX' },
  { symbol: '^CRSLDX', name: 'Nifty Total Market', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Overall market movement proxy.', type: 'Index' },
  { symbol: 'NIFTY_NEXT_50.NS', name: 'NIFTY NEXT 50', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Next 50 companies after Nifty 50.', type: 'Index' },
  { symbol: '^CNX100', name: 'NIFTY 100', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'Top 100 large/mid entities.', type: 'Index' },
  { symbol: 'NIFTY_MIDCAP_100.NS', name: 'NIFTY Midcap 100', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Top 100 midcap companies.', type: 'Index' },
  { symbol: 'BSE-100.BO', name: 'Bse 100', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'BSE top 100 companies.', type: 'Index' },
  { symbol: '^CRSLDX', name: 'NIFTY 500', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'Nifty Top 500 companies.', type: 'Index' },
  { symbol: '^CNXAUTO', name: 'NIFTY Auto', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Automobile sector index.', type: 'Index' },
  { symbol: 'NIFTY_SMLCAP_100.NS', name: 'NIFTY Smallcap 100', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Top 100 smallcap companies.', type: 'Index' },
  { symbol: '^CNXFMCG', name: 'NIFTY FMCG', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Low', reasoning: 'FMCG sector index.', type: 'Index' },
  { symbol: '^CNXMETAL', name: 'NIFTY Metal', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Metal sector index.', type: 'Index' },
  { symbol: '^CNXPHARMA', name: 'NIFTY Pharma', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Pharmaceutical sector index.', type: 'Index' },
  { symbol: '^CNXPSUBANK', name: 'NIFTY PSU Bank', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Public sector banks index.', type: 'Index' },
  { symbol: '^CNXIT', name: 'NIFTY IT', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'IT sector index.', type: 'Index' },
  { symbol: 'BSE-SMLCAP.BO', name: 'Bse Smallcap', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'BSE smallcap companies.', type: 'Index' },
  { symbol: 'NIFTY_SMLCAP_250.NS', name: 'NIFTY SMALLCAP 250', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Broader smallcap segment index.', type: 'Index' },
  { symbol: 'NIFTY_MIDCAP_150.NS', name: 'NIFTY MIDCAP 150', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'Moderate', reasoning: 'Broader midcap segment index.', type: 'Index' },
  { symbol: '^CNXCMDT', name: 'NIFTY Commodities', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Commodities sector index.', type: 'Index' },
  { symbol: 'BSE-IPO.BO', name: 'Bse IPO', price: 0, change: 0, percentChange: 0, expectedReturn: '-', riskLevel: 'High', reasoning: 'Newly listed IPO index.', type: 'Index' }
];

const fetchWithTimeout = (url: string, timeout = 5000) =>
  Promise.race([
    fetch(url).then(res => res.json()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    )
  ]);

const simulateStockMovement = () => {
  currentStocks = currentStocks.map(stock => {
    const volatility = stock.riskLevel === 'High' ? 0.001 : stock.riskLevel === 'Moderate' ? 0.0006 : 0.0003;
    const direction = Math.random() > 0.48 ? 1 : -1;
    const movementPercent = (Math.random() * volatility) * direction;
    const movementAmount = stock.price * movementPercent;

    return {
      ...stock,
      price: parseFloat((stock.price + movementAmount).toFixed(2)),
      change: parseFloat((stock.change + movementAmount).toFixed(2)),
      percentChange: parseFloat((stock.percentChange + (movementPercent * 100)).toFixed(2))
    };
  });
  return [...currentStocks];
};

export const apiService = {


  async getAllIndices() {
    try {
      const res = await fetch("http://localhost:5000/api/indices"); // change URL if needed
      
      if (!res.ok) {
        throw new Error("Failed to fetch indices");
      }

      return await res.json();
    } catch (error) {
      console.error("API ERROR:", error);
      return [];
    }
  },

  // --- INCOMES ---
  getIncomes: async (): Promise<IncomeItem[]> => {
    return Promise.resolve([...mockIncomes]);
  },

  addIncome: async (item: Omit<IncomeItem, 'id'>): Promise<IncomeItem> => {
    const newItem = { ...item, id: Date.now() };
    mockIncomes.push(newItem);
    return Promise.resolve(newItem);
  },

  deleteIncome: async (id: number): Promise<void> => {
    mockIncomes = mockIncomes.filter(i => i.id !== id);
    return Promise.resolve();
  },

  // --- EXPENSES ---
  getExpenses: async (): Promise<ExpenseItem[]> => {
    return Promise.resolve([...mockExpenses]);
  },

  addExpense: async (item: Omit<ExpenseItem, 'id'>): Promise<ExpenseItem> => {
    const newItem = { ...item, id: Date.now() };
    mockExpenses.push(newItem);
    return Promise.resolve(newItem);
  },

  deleteExpense: async (id: number): Promise<void> => {
    mockExpenses = mockExpenses.filter(e => e.id !== id);
    return Promise.resolve();
  },

  // --- INVESTMENTS ---
  getInvestments: async (): Promise<Investment[]> => {
    return Promise.resolve(storageService.getInvestments());
  },

  addInvestment: async (item: Omit<Investment, 'id'>): Promise<Investment> => {
    const investments = storageService.getInvestments();
    const newInvestment = { ...item, id: crypto.randomUUID() };
    investments.push(newInvestment);
    storageService.saveInvestments(investments);
    return Promise.resolve(newInvestment);
  },

  deleteInvestment: async (id: string): Promise<void> => {
    const investments = storageService.getInvestments();
    const newInvestments = investments.filter(i => i.id !== id);
    storageService.saveInvestments(newInvestments);
    return Promise.resolve();
  },

  // --- STOCKS & MARKET SENTIMENT ---
  getMarketSentiment: async (): Promise<MarketSentiment> => {
    // Simulated live data for sentiment
    return Promise.resolve({
      trend: 'Bullish',
      riskIndicator: 'Low-to-Moderate volatility expected this week.',
      fiiFlow: 1450.25,
      diiFlow: 890.12
    });
  },

  getStockRecommendations: async (riskLevel: string): Promise<StockRecommendation[]> => {
    const now = Date.now();

    if (stocksCache.data && (now - stocksCache.timestamp < CACHE_DURATION)) {
      const data = stocksCache.data;
      if (riskLevel === 'All') return data;
      return data.filter(r => r.riskLevel === riskLevel);
    }

    try {
      const updatedStocks = await Promise.all(
        currentStocks.map(async (stock) => {
          try {
            const url = `${API_BASE_URL.replace('/api', '')}/api/quote/${encodeURIComponent(stock.symbol)}`;
            const response = await fetch(url);
            const apiData = await response.json();
            if (apiData && !apiData.error && apiData.price !== undefined) {
              return {
                ...stock,
                price: apiData.price,
                change: apiData.change,
                percentChange: apiData.percentChange
              };
            }
          } catch (e) { }
          return stock;
        })
      );

      const anyUpdated = updatedStocks.some((s, i) => s.price !== currentStocks[i].price);
      const finalStocks = anyUpdated ? updatedStocks : simulateStockMovement();

      currentStocks = finalStocks;
      stocksCache = { data: finalStocks, timestamp: now };

      if (riskLevel === 'All') return finalStocks;
      return finalStocks.filter(r => r.riskLevel === riskLevel);
    } catch (error) {
      const simulated = simulateStockMovement();
      if (riskLevel === 'All') return simulated;
      return simulated.filter(r => r.riskLevel === riskLevel);
    }
  },
  getStocks: async (symbols: string[]): Promise<StockRecommendation[]> => {
    // ✅ IMPROVEMENT 1: Avoid unnecessary calls
    if (!symbols || symbols.length === 0) return [];

    try {
      const responses = await Promise.allSettled(
        symbols.map(symbol =>
          fetchWithTimeout(`${API_BASE_URL}/quote/${encodeURIComponent(symbol)}`)
        )
      );

      return responses.map((res, index) => {
        const symbol = symbols[index];

        // Match original mapped exact symbol
        const base = currentStocks.find(s => s.symbol === symbol) || {
          symbol: symbol,
          name: symbol,
          price: 0,
          change: 0,
          percentChange: 0,
          expectedReturn: '-',
          riskLevel: 'Moderate' as const,
          reasoning: '',
          type: 'Stock' as const
        };

        // ✅ SUCCESS CASE
        if (res.status === "fulfilled" && !res.value?.error) {
          return {
            ...base,
            symbol, // keep original symbol
            price: Number(res.value?.price || 0),
            change: Number(res.value?.change || 0),
            percentChange: Number(res.value?.percentChange || 0),
            riskLevel: base.riskLevel
          };
        }

        // ✅ FALLBACK CASE
        return {
          ...base,
          symbol
        };
      });

    } catch (error) {
      console.error("Stock fetch failed:", error);

      return symbols.map(symbol => {
        const base = currentStocks.find(s => s.symbol === symbol);

        return {
          ...base,
          symbol,
          price: base?.price || 0,
          change: base?.change || 0,
          percentChange: base?.percentChange || 0,
          riskLevel: base?.riskLevel || 'Moderate',
          expectedReturn: base?.expectedReturn || '-',
          reasoning: base?.reasoning || '',
          type: base?.type || 'Stock',
          name: base?.name || symbol
        };
      }) as StockRecommendation[];
    }
  },
  calculateUserRiskCapacity: async (): Promise<{ level: 'Low' | 'Moderate' | 'High'; freeCashPercent: number }> => {
    const incomes = mockIncomes.reduce((acc, i) => acc + Number(i.amount), 0);
    const expenses = mockExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const freeCash = incomes - expenses;
    const freeCashPercent = (freeCash / incomes);

    let level: 'Low' | 'Moderate' | 'High' = 'Low';
    if (freeCashPercent > 0.25) level = 'High';
    else if (freeCashPercent >= 0.1) level = 'Moderate';

    return { level, freeCashPercent: Math.round(freeCashPercent * 100) };
  },

  // --- GOALS CRUD ---
  addGoal: async (goalData: any): Promise<Goal> => {
    const goals = storageService.getGoals();
    const newGoal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      currentAmount: Number(goalData.currentAmount),
      targetAmount: Number(goalData.targetAmount),
      status: 'ACTIVE'
    };
    goals.push(newGoal);
    storageService.saveGoals(goals);
    return Promise.resolve(newGoal);
  },

  updateGoal: async (goal: Goal): Promise<Goal> => {
    const goals = storageService.getGoals();
    const index = goals.findIndex(g => g.id === goal.id);
    if (index !== -1) {
      goals[index] = { ...goal, currentAmount: Number(goal.currentAmount), targetAmount: Number(goal.targetAmount) };
      storageService.saveGoals(goals);
    }
    return Promise.resolve(goal);
  },

  deleteGoal: async (id: string): Promise<void> => {
    const goals = storageService.getGoals();
    const newGoals = goals.filter(g => g.id !== id);
    storageService.saveGoals(newGoals);
    return Promise.resolve();
  },

  // --- CONTEXT AGGREGATOR FOR AI ---
  getFinancialContext: async (): Promise<any> => {
    try {
      const user = storageService.getUser();
      if (!user) return null;

      const incomes = await apiService.getIncomes();
      const expenses = await apiService.getExpenses();
      const goals = await apiService.getGoalSummary();
      const investments = storageService.getInvestments();
      const liabilities = storageService.getLiabilities();

      const monthlyIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
      const monthlyExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const monthlyFreeCash = Math.max(0, monthlyIncome - monthlyExpenses);

      return {
        userProfile: { name: user.fullName, balance: user.balance },
        financials: {
          monthlyIncome,
          monthlyExpenses,
          monthlyFreeCash,
          safetyBuffer: monthlyExpenses, // 1 month expense
          usableLumpSum: Math.max(0, user.balance - monthlyExpenses)
        },
        goals: goals.goals.filter(g => g.status === 'ACTIVE').map(g => ({
          name: g.title,
          target: g.targetAmount,
          saved: g.currentAmount,
          dueDate: g.dueDate
        })),
        portfolio: {
          totalValue: investments.reduce((s, i) => s + i.value, 0),
          items: investments.map(i => ({ name: i.name, type: i.type, value: i.value }))
        },
        debts: liabilities.map(l => ({ name: l.title, amount: l.totalAmount, rate: l.interestRate }))
      };
    } catch (e) {
      console.error("Error fetching financial context:", e);
      return null;
    }
  },

  // --- MARKET INDICES ---
  getIndices: async (): Promise<MarketData> => {
    const now = Date.now();

    if (indicesCache.data && (now - indicesCache.timestamp < CACHE_DURATION)) {
      return Promise.resolve(indicesCache.data);
    }

    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/indices`);
      const apiData = await response.json();

      if (apiData && Object.keys(apiData).length > 0) {
        const simulated = simulateMarketMovement();
        const newData: MarketData = {
          nifty50: apiData.nifty50 ? { name: 'NIFTY 50', ...apiData.nifty50 } : simulated.nifty50,
          sensex: apiData.sensex ? { name: 'SENSEX', ...apiData.sensex } : simulated.sensex,
          niftyFinService: apiData.niftyFinService ? { name: 'NIFTY FINANCIAL SERVICES', ...apiData.niftyFinService } : simulated.niftyFinService,
          bankex: apiData.bankex ? { name: 'BSE BANKEX', ...apiData.bankex } : simulated.bankex
        };
        currentIndices = newData;
        indicesCache = { data: newData, timestamp: now };
        return newData;
      }

      const simulated = simulateMarketMovement();
      currentIndices = simulated;
      return simulated;
    } catch (error) {
      const simulated = simulateMarketMovement();
      currentIndices = simulated;
      return simulated;
    }
  },

  getNews: async (): Promise<Article[]> => {
    try {
      // Connects to our multi-source backend RSS proxy (Economic Times, CNBC, etc.)
      const response = await fetch(`${API_BASE_URL}/news/pulse`);
      if (!response.ok) throw new Error('News proxy failing');
      let data = await response.json();
      
      // Since the backend RSS feeds are strictly curated for "Markets" & "Finance", 
      // we only need a very light filter against pure politics/entertainment, or just pass them raw!
      const excludedKeywords = /\b(hollywood|bollywood|movie|cricket|entertainment|sports|fashion|celebrity)\b/i;
      
      data = data.filter((item: any) => {
        const text = `${item.title} ${item.description}`.toLowerCase();
        return !excludedKeywords.test(text);
      });
      
      return data;
    } catch (error) {
      console.warn("News fetching failed, returning mock data", error);
      return Promise.resolve(MOCK_NEWS);
    }
  },

  // --- GOALS LOGIC ---
  getGoalSummary: async (): Promise<GoalSummary> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/summary`);
      if (!response.ok) throw new Error("Mocking");
      return await response.json();
    } catch (error) {
      const goals = storageService.getGoals();
      return Promise.resolve({
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'ACTIVE').length,
        completedGoals: goals.filter(g => g.status === 'COMPLETED').length,
        goals
      });
    }
  },

  getGoalDetails: async (goalId: string): Promise<GoalDetails> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}/details`);
      if (!response.ok) throw new Error("Mocking");
      return await response.json();
    } catch (error) {
      const user = storageService.getUser();
      const allGoals = storageService.getGoals();
      const targetGoal = allGoals.find(g => g.id === goalId);

      if (!targetGoal || !user) throw new Error("Goal or User not found");

      const extractedBalance = user.balance;
      const monthlyIncome = mockIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
      const monthlyExpenses = mockExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

      const fixedCategories = ['Housing', 'Utilities', 'Transport', 'Education'];
      const activeCommitments = mockExpenses
        .filter(e => fixedCategories.includes(e.category))
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const safetyBuffer = monthlyExpenses;
      const lumpSumFreeCash = Math.max(extractedBalance - safetyBuffer, 0);
      const monthlyFreeCash = Math.max(monthlyIncome - monthlyExpenses, 0);
      const monthlyGoalBudget = monthlyFreeCash * 0.7;

      const activeGoals = allGoals.filter(g => g.status === 'ACTIVE');
      let totalIdealMonthly = 0;

      activeGoals.forEach(g => {
        const rem = Math.max(g.targetAmount - g.currentAmount, 0);
        let mLeft = 12;
        if (g.dueDate) {
          const now = new Date();
          const due = new Date(g.dueDate);
          const diffTime = due.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          mLeft = Math.max(0.5, daysLeft / 30);
        }
        const ideal = rem / mLeft;
        totalIdealMonthly += ideal;
      });

      const scaleFactor = totalIdealMonthly > monthlyGoalBudget && totalIdealMonthly > 0
        ? monthlyGoalBudget / totalIdealMonthly
        : 1;

      const boostPool = lumpSumFreeCash * 0.5;
      const totalRemaining = activeGoals.reduce((sum, g) => sum + Math.max(g.targetAmount - g.currentAmount, 0), 0);

      const remainingAmount = Math.max(targetGoal.targetAmount - targetGoal.currentAmount, 0);

      let monthsLeft = 12;
      if (targetGoal.dueDate) {
        const now = new Date();
        const due = new Date(targetGoal.dueDate);
        const diffTime = due.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        monthsLeft = Math.max(0.1, daysLeft / 30);
      }

      const yearsLeft = monthsLeft / 12;

      const idealMonthlyContribution = remainingAmount / monthsLeft;
      const recommendedMonthlyContribution = idealMonthlyContribution * scaleFactor;

      let boostContribution = 0;
      if (totalRemaining > 0 && targetGoal.status === 'ACTIVE') {
        const share = remainingAmount / totalRemaining;
        boostContribution = boostPool * share;
      }
      boostContribution = Math.floor(boostContribution / 100) * 100;

      const progressPercentage = Math.min(200, (targetGoal.currentAmount / targetGoal.targetAmount) * 100);

      const recommendations: string[] = [];
      const formatINR = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

      if (monthlyFreeCash <= 0) {
        recommendations.push(`Your monthly expenses (${formatINR(monthlyExpenses)}) currently consume your entire income. Consider reducing discretionary spending to fund this goal.`);
      } else {
        if (scaleFactor < 1) {
          recommendations.push(`Based on your monthly free cash of ${formatINR(monthlyFreeCash)}, we recommend a realistic contribution of ${formatINR(recommendedMonthlyContribution)} (adjusted from ideal ${formatINR(idealMonthlyContribution)}) to balance all your goals.`);
        } else {
          recommendations.push(`You have sufficient free cash! Contribute ${formatINR(recommendedMonthlyContribution)} monthly to reach your target by ${targetGoal.dueDate ? new Date(targetGoal.dueDate).toLocaleDateString() : 'next year'}.`);
        }
      }

      if (yearsLeft > 5) {
        recommendations.push(`Since this is a long-term goal (${yearsLeft.toFixed(1)} years), consider allocating your contributions to diversified Equity Mutual Funds to potentially beat inflation.`);
      } else if (yearsLeft < 3) {
        recommendations.push(`For this short-term goal (<3 years), prioritize capital safety by using Debt Funds or Fixed Deposits.`);
      } else {
        recommendations.push(`With a medium-term horizon (${yearsLeft.toFixed(1)} years), a balanced approach (Hybrid Funds) offers a good mix of growth and stability.`);
      }

      if (boostContribution > 1000) {
        recommendations.push(`Great news! Your bank balance (${formatINR(extractedBalance)}) has a surplus. We suggest a one-time boost of ${formatINR(boostContribution)} to accelerate this goal.`);
      }

      if (progressPercentage > 100) {
        recommendations.push("This goal is overfunded! Consider reallocating the surplus to other active goals.");
      } else if (progressPercentage < 10 && remainingAmount > 0) {
        recommendations.push("Just getting started? Set up an auto-debit for your recommended monthly contribution to build a habit.");
      }

      return Promise.resolve({
        goal: targetGoal,
        extractedBalance,
        monthlyIncome,
        monthlyExpenses,
        activeCommitments,
        safetyBuffer,
        lumpSumFreeCash,
        monthlyFreeCash,
        remainingAmount,
        monthsLeft,
        idealMonthlyContribution,
        recommendedMonthlyContribution,
        boostContribution,
        progressPercentage,
        recommendations
      });
    }
  },

  // --- FINANCIAL SUMMARY ---
  getFinancialSummary: async (): Promise<FinancialSummary> => {
    const incomes = mockIncomes.reduce((acc, i) => acc + Number(i.amount), 0);
    const expenses = mockExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const investments = storageService.getInvestments().reduce((acc, i) => acc + i.value, 0);
    const debts = storageService.getLiabilities().reduce((acc, l) => acc + l.totalAmount, 0);

    return Promise.resolve({
      monthlyIncome: incomes,
      monthlyExpenses: expenses,
      investments,
      debts
    });
  },

  // --- PROFILE ---
  getUserProfile: async (): Promise<UserProfile> => {
    const user = storageService.getUser();
    if (!user) throw new Error("No user");
    return Promise.resolve({
      ...user,
      ...mockProfileData,
      firstName: user.fullName.split(' ')[0],
      lastName: user.fullName.split(' ').slice(1).join(' ') || '',
      location: mockProfileData.location || '',
      dob: mockProfileData.dob || ''
    });
  },

  updateUserProfile: async (data: Partial<UserProfile>): Promise<void> => {
    const user = storageService.getUser();
    if (user) {
      const updatedUser = {
        ...user,
        fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email || user.email,
        phone: data.phone || user.phone
      };
      storageService.saveUser(updatedUser);
    }
    mockProfileData = { ...mockProfileData, ...data };
    return Promise.resolve();
  },

  getBankStatement: async (): Promise<BankStatementMetadata> => {
    const user = storageService.getUser();
    return Promise.resolve({
      fileName: user?.bankStatementName || 'No Statement',
      uploadedAt: user?.lastUpdated || new Date().toISOString(),
      extractedBalance: user?.balance || 0
    });
  },

  uploadBankStatement: async (file: File): Promise<BankStatementMetadata> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];

          // Use Gemini
          const analysis = await analyzeBankStatement(base64Data, file.type);

          // Update User Balance
          const user = storageService.getUser();
          if (user) {
            user.balance = analysis.balance;
            user.bankStatementName = file.name;
            user.lastUpdated = new Date().toISOString();
            storageService.saveUser(user);
          }

          resolve({
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            extractedBalance: analysis.balance,
            fileUrl: '#'
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(file);
    });
  },

  // --- FINANCIAL PATHWAY GENERATOR ---
  generateFinancialPath: async (riskProfile: RiskProfile, manualGoals: PathGoalInput[]): Promise<FinancialPathResponse> => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not found");

    const extractedBalance = user.balance;
    const monthlyIncome = mockIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const monthlyExpenses = mockExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    const fixedCategories = ['Housing', 'Utilities', 'Transport', 'Education'];
    const commitments = mockExpenses
      .filter(e => fixedCategories.includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const inflationRate = 0.05; // 5% Inflation
    let annualReturnRate = 0.08;
    if (riskProfile === 'Moderate') annualReturnRate = 0.12;
    if (riskProfile === 'Aggressive') annualReturnRate = 0.16;

    const r = annualReturnRate / 12;
    const budgetShare = 0.7;

    const safetyBuffer = monthlyExpenses;
    const usableLumpSum = Math.max(extractedBalance - safetyBuffer, 0);
    const monthlyFreeCash = Math.max(monthlyIncome - monthlyExpenses - commitments, 0);
    const monthlyGoalBudget = monthlyFreeCash * budgetShare;

    const goals: PathGoalResult[] = manualGoals.map(g => {
      const futureTarget = g.targetToday * Math.pow(1 + inflationRate, g.years);
      const monthsLeft = Math.floor(g.years * 12);

      return {
        id: g.id,
        name: g.name,
        targetToday: g.targetToday,
        futureTarget: Math.round(futureTarget),
        years: g.years,
        monthsLeft,
        currentAmount: g.currentAmount,
        lumpSumApplied: 0,
        remainingNeeded: 0,
        idealMonthly: 0,
        recommendedMonthly: 0,
        shortfall: false,
        estimatedCompletionDate: '',
        status: 'On Track'
      };
    });

    const totalTargets = goals.reduce((s, g) => s + g.futureTarget, 0);
    const boostPool = usableLumpSum * 0.5;

    goals.forEach(g => {
      const weight = totalTargets > 0 ? g.futureTarget / totalTargets : 0;
      g.lumpSumApplied = Math.floor(boostPool * weight);

      const fvCurrent = (g.currentAmount + g.lumpSumApplied) * Math.pow(1 + annualReturnRate, g.years);
      g.remainingNeeded = Math.max(0, g.futureTarget - fvCurrent);

      if (r > 0 && g.monthsLeft > 0) {
        g.idealMonthly = Math.ceil(g.remainingNeeded * r / (Math.pow(1 + r, g.monthsLeft) - 1));
      } else if (g.monthsLeft > 0) {
        g.idealMonthly = Math.ceil(g.remainingNeeded / g.monthsLeft);
      } else {
        g.idealMonthly = g.remainingNeeded;
      }
    });

    const totalIdealMonthly = goals.reduce((s, g) => s + g.idealMonthly, 0);
    goals.forEach(g => {
      if (totalIdealMonthly <= monthlyGoalBudget) {
        g.recommendedMonthly = g.idealMonthly;
        g.status = 'On Track';
      } else {
        const scale = monthlyGoalBudget / totalIdealMonthly;
        g.recommendedMonthly = Math.floor(g.idealMonthly * scale);
        g.shortfall = true;
        g.status = 'At Risk';
      }

      const today = new Date();
      const completionDate = new Date(today.setMonth(today.getMonth() + g.monthsLeft));
      g.estimatedCompletionDate = completionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    });

    const maxMonths = Math.max(...goals.map(g => g.monthsLeft), 24);
    const timeline: TimelinePoint[] = [];

    let cumulativePortfolio = goals.reduce((s, g) => s + g.currentAmount + g.lumpSumApplied, 0);

    const goalsByMonth: Record<number, PathGoalResult[]> = {};
    goals.forEach(g => {
      if (!goalsByMonth[g.monthsLeft]) goalsByMonth[g.monthsLeft] = [];
      goalsByMonth[g.monthsLeft].push(g);
    });

    for (let m = 1; m <= maxMonths; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() + m);

      const monthlyContributions = goals.reduce((s, g) => {
        return m <= g.monthsLeft ? s + g.recommendedMonthly : s;
      }, 0);

      cumulativePortfolio = (cumulativePortfolio * (1 + r)) + monthlyContributions;

      let totalTargetAtMonth = 0;
      goals.forEach(g => {
        if (m <= g.monthsLeft) {
          const progress = m / g.monthsLeft;
          const start = g.currentAmount + g.lumpSumApplied;
          totalTargetAtMonth += start + (g.futureTarget - start) * progress;
        } else {
          totalTargetAtMonth += g.futureTarget;
        }
      });

      timeline.push({
        month: m,
        date: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        label: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        cumulativeTarget: Math.round(totalTargetAtMonth),
        projectedPortfolio: Math.round(cumulativePortfolio),
        milestones: goalsByMonth[m] || []
      });
    }

    const recommendations: string[] = [];
    if (totalIdealMonthly > monthlyGoalBudget) {
      recommendations.push(`Budget Shortfall: You need ₹${(totalIdealMonthly - monthlyGoalBudget).toLocaleString()} more monthly. Consider extending the timeline for '${goals.find(g => g.shortfall)?.name}' by 1-2 years.`);
    } else {
      recommendations.push("You are On Track! Your monthly surplus allows you to boost investments or add a new goal.");
    }

    return Promise.resolve({
      goals,
      timeline,
      summary: {
        monthlyFreeCash,
        usableLumpSum,
        monthlyGoalBudget,
        totalIdealMonthly,
        totalRecommendedMonthly: goals.reduce((s, g) => s + g.recommendedMonthly, 0),
        riskProfile,
        projectedReturns: annualReturnRate,
        recommendations
      }
    });
  }
};
