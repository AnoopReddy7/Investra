// src/pages/Stocks.tsx

import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { StockRecommendation } from "../types";
import { TrendingUp, Activity, Shield, Star } from "lucide-react";

type Stock = StockRecommendation;

const Stocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filtered, setFiltered] = useState<Stock[]>([]);
  const [filter, setFilter] = useState<"All" | "Index" | "Stock" | "ETF" | "VIX">("All");
  const [riskLevel, setRiskLevel] = useState("All");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [riskCapacity, setRiskCapacity] = useState({ level: "High", freeCashPercent: 61 });
  const [marketSentiment, setMarketSentiment] = useState<any>({});

  // ✅ Fetch stocks
  const fetchStocks = async () => {
    const data = await apiService.getStockRecommendations("All");
    setStocks(data);
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Filters
  useEffect(() => {
    let result = [...stocks];

    if (filter !== "All") {
      result = result.filter((s) => s.type === filter);
    }

    if (riskLevel !== "All") {
      result = result.filter((s) => s.riskLevel === riskLevel);
    }

    setFiltered(result);
  }, [stocks, filter, riskLevel]);

  // ✅ Watchlist
  const toggleWatchlist = (name: string) => {
    setWatchlist((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : [...prev, name]
    );
  };

  // ✅ Risk + Sentiment
  useEffect(() => {
    apiService.calculateUserRiskCapacity().then(setRiskCapacity);
    apiService.getMarketSentiment().then(setMarketSentiment);
  }, []);

  const getRiskColor = (risk: string) => {
    if (risk === "Low") return "bg-green-500";
    if (risk === "Moderate") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex gap-6 p-6 text-white">
      
      {/* LEFT PANEL */}
      <div className="w-80 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Activity size={18}/> Risk Capacity
          </h3>
          <div>{riskCapacity.level}</div>
          <div>{riskCapacity.freeCashPercent}% cash</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp size={18}/> Market Sentiment
          </h3>
          <div>{marketSentiment.riskIndicator}</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield size={18}/> Security
          </h3>
          <p className="text-sm text-gray-400">
            Data may be delayed ~1 min
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1">
        
        {/* Filters */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {["All", "Index", "Stock", "ETF", "VIX"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded ${
                  filter === f ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-slate-700 px-2 py-1 rounded"
          >
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Stocks */}
        <div className="space-y-4">
          {filtered.map((stock) => (
            <div key={stock.name} className="bg-slate-800 p-4 rounded-xl flex justify-between">
              
              <div>
                <h4 className="font-semibold">{stock.name}</h4>
                <div className="text-sm text-gray-400">{stock.symbol}</div>

                <div className="text-lg font-bold mt-1">
                  ₹{stock.price.toFixed(2)}
                </div>

                <div className={stock.change >= 0 ? "text-green-400" : "text-red-400"}>
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                </div>

                <div className={`text-xs mt-1 px-2 py-1 rounded ${getRiskColor(stock.riskLevel)}`}>
                  {stock.riskLevel}
                </div>
              </div>

              <button onClick={() => toggleWatchlist(stock.name)}>
                <Star
                  className={
                    watchlist.includes(stock.name)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-400"
                  }
                />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Stocks;