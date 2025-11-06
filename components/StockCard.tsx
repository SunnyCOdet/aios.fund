'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StockData } from '@/lib/api';

interface StockCardProps {
  stock: StockData;
  onClick: () => void;
}

export default function StockCard({ stock, onClick }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <div
      onClick={onClick}
      className="glass-effect rounded-xl p-6 cursor-pointer hover:bg-white/[0.03] transition-all duration-300 border-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{stock.name}</h3>
          <p className="text-gray-400 text-sm">{stock.symbol}</p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</p>
          <div
            className={`flex items-center gap-1 mt-1 ${
              isPositive ? 'text-white' : 'text-gray-500'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-semibold">
              {isPositive ? '+' : ''}
              {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.1] grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400">High</p>
          <p className="font-semibold text-white">${stock.high.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Low</p>
          <p className="font-semibold text-white">${stock.low.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Volume</p>
          <p className="font-semibold text-white">
            {(stock.volume / 1e6).toFixed(2)}M
          </p>
        </div>
      </div>
    </div>
  );
}

