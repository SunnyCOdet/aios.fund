'use client';

import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import StockCard from './StockCard';
// Using API route instead of direct import to avoid CORS issues
import type { StockData } from '@/lib/api';

interface StockSearchProps {
  onSelect?: (stock: StockData) => void;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [symbol, setSymbol] = useState('');
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError('');
    setStock(null);
    
    try {
      // Use Next.js API route to avoid CORS issues
      const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(symbol.trim())}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stock data');
      }
      
      if (result) {
        setStock(result);
        if (onSelect) {
          onSelect(result);
        }
      } else {
        setError('Stock not found. Please check the symbol.');
      }
    } catch (err: any) {
      // Use the error message from the API if available
      const errorMessage = err?.message || 'Failed to fetch stock data. Please try again.';
      setError(errorMessage);
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <TrendingUp className="w-5 h-5 text-gray-400" />
        Stock Search
      </h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL, MSFT, TSLA)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 rounded-lg bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/[0.1]"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm">
          {error}
        </div>
      )}

      {stock && (
        <div>
          <StockCard stock={stock} onClick={() => {
            if (onSelect) {
              onSelect(stock);
            }
          }} />
          <p className="text-xs text-gray-400 mt-2">
            💡 Predictions are shown in the panel above
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/[0.1]">
        <p className="text-xs text-gray-400 mb-2">Popular Stocks:</p>
        <div className="flex flex-wrap gap-2">
          {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'].map((sym) => (
            <button
              key={sym}
              onClick={() => {
                setSymbol(sym);
                handleSearch();
              }}
              disabled={loading}
              className="px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] rounded-full text-xs transition-colors text-gray-300 border border-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sym}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Using free Yahoo Finance API (no key required). Falls back to Alpha Vantage if needed.
        </p>
      </div>
    </div>
  );
}

