import React from "react";

type Indices = {
  nifty50: { value: number; change: number; percent: number };
  sensex: { value: number; change: number; percent: number };
  niftyFinancial: { value: number; change: number; percent: number };
  bankNifty: { value: number; change: number; percent: number };
};

interface Props {
  indices: Indices | null;
}

const MarketTicker: React.FC<Props> = ({ indices }) => {

  if (!indices) {
    return <div className="text-white">Loading market data...</div>;
  }

  return (
    <div className="bg-surface border border-slate-700 rounded-xl p-4 flex justify-between text-white">

      <div>
        <p className="text-slate-400 text-sm">NIFTY 50</p>
        <p className="font-bold">{indices.nifty50.value}</p>
      </div>

      <div>
        <p className="text-slate-400 text-sm">SENSEX</p>
        <p className="font-bold">{indices.sensex.value}</p>
      </div>

      <div>
        <p className="text-slate-400 text-sm">BANK NIFTY</p>
        <p className="font-bold">{indices.bankNifty.value}</p>
      </div>

      <div>
        <p className="text-slate-400 text-sm">NIFTY FINANCIAL</p>
        <p className="font-bold">{indices.niftyFinancial.value}</p>
      </div>

    </div>
  );
};

export default MarketTicker;