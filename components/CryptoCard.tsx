'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CryptoData } from '@/lib/api';

interface CryptoCardProps {
  crypto: CryptoData;
  onClick: () => void;
}

export default function CryptoCard({ crypto, onClick }: CryptoCardProps) {
  const isPositive = crypto.price_change_percentage_24h >= 0;

  return (
    <div
      onClick={onClick}
      className="glass-effect rounded-xl p-6 cursor-pointer hover:bg-white/[0.03] transition-all duration-300 border-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {crypto.image && (
            <img
              src={crypto.image}
              alt={crypto.name}
              width={48}
              height={48}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{crypto.name}</h3>
            <p className="text-gray-400 text-sm uppercase">{crypto.symbol}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            ${crypto.current_price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
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
              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.1] grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Market Cap</p>
          <p className="font-semibold text-white">
            ${(crypto.market_cap / 1e9).toFixed(2)}B
          </p>
        </div>
        <div>
          <p className="text-gray-400">Volume (24h)</p>
          <p className="font-semibold text-white">
            ${(crypto.total_volume / 1e9).toFixed(2)}B
          </p>
        </div>
      </div>
    </div>
  );
}

