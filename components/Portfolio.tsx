'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getTopCryptos } from '@/lib/api';
import type { CryptoData, StockData } from '@/lib/api';

interface Holding {
  id: string;
  type: 'crypto' | 'stock';
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  image?: string;
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'crypto' as 'crypto' | 'stock',
    symbol: '',
    name: '',
    quantity: '',
    purchasePrice: '',
    image: '',
  });
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load holdings from localStorage
    const saved = localStorage.getItem('portfolio');
    if (saved) {
      const savedHoldings = JSON.parse(saved);
      setHoldings(savedHoldings);
      updatePrices(savedHoldings);
    }
    loadCryptos();
  }, []);

  useEffect(() => {
    // Update prices every 30 seconds
    if (holdings.length === 0) return;
    
    const interval = setInterval(() => {
      updatePrices(holdings);
    }, 30000);

    return () => clearInterval(interval);
  }, [holdings]);

  useEffect(() => {
    // Save to localStorage whenever holdings change
    if (holdings.length > 0) {
      localStorage.setItem('portfolio', JSON.stringify(holdings));
    }
  }, [holdings]);

  const loadCryptos = async () => {
    try {
      const data = await getTopCryptos(50);
      setCryptos(data);
    } catch (error) {
      console.error('Error loading cryptos:', error);
    }
  };

  const updatePrices = async (currentHoldings: Holding[]) => {
    setLoading(true);
    try {
      const updatedHoldings = await Promise.all(
        currentHoldings.map(async (holding) => {
          if (holding.type === 'crypto') {
            try {
              const response = await fetch(`/api/crypto?query=${encodeURIComponent(holding.symbol)}`);
              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                  const crypto = data.find((c: CryptoData) => 
                    c.symbol.toLowerCase() === holding.symbol.toLowerCase() ||
                    c.id.toLowerCase() === holding.id.toLowerCase()
                  ) || data[0];
                  return {
                    ...holding,
                    currentPrice: crypto.current_price,
                    image: crypto.image,
                  };
                }
              }
            } catch (error) {
              console.error(`Error updating price for ${holding.symbol}:`, error);
            }
          } else {
            try {
              const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(holding.symbol)}`);
              if (response.ok) {
                const stock: StockData = await response.json();
                return {
                  ...holding,
                  currentPrice: stock.price,
                };
              }
            } catch (error) {
              console.error(`Error updating price for ${holding.symbol}:`, error);
            }
          }
          return holding;
        })
      );
      setHoldings(updatedHoldings);
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = () => {
    if (!formData.symbol || !formData.name || !formData.quantity || !formData.purchasePrice) {
      alert('Please fill in all fields');
      return;
    }

    const newHolding: Holding = {
      id: `${formData.type}-${formData.symbol}-${Date.now()}`,
      type: formData.type,
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.purchasePrice), // Will be updated
      image: formData.image || undefined,
    };

    // If crypto, try to find current price
    if (formData.type === 'crypto' && cryptos.length > 0) {
      const crypto = cryptos.find(c => 
        c.symbol.toLowerCase() === formData.symbol.toLowerCase() ||
        c.id.toLowerCase() === formData.symbol.toLowerCase()
      );
      if (crypto) {
        newHolding.currentPrice = crypto.current_price;
        newHolding.image = crypto.image;
      }
    }

    setHoldings([...holdings, newHolding]);
    setFormData({
      type: 'crypto',
      symbol: '',
      name: '',
      quantity: '',
      purchasePrice: '',
      image: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveHolding = (id: string) => {
    if (confirm('Are you sure you want to remove this holding?')) {
      setHoldings(holdings.filter(h => h.id !== id));
    }
  };

  const calculateTotalValue = () => {
    return holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
  };

  const calculateTotalCost = () => {
    return holdings.reduce((sum, h) => sum + (h.quantity * h.purchasePrice), 0);
  };

  const calculateProfitLoss = () => {
    return calculateTotalValue() - calculateTotalCost();
  };

  const calculateProfitLossPercent = () => {
    const cost = calculateTotalCost();
    if (cost === 0) return 0;
    return ((calculateProfitLoss() / cost) * 100);
  };

  const totalValue = calculateTotalValue();
  const totalCost = calculateTotalCost();
  const profitLoss = calculateProfitLoss();
  const profitLossPercent = calculateProfitLossPercent();

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <Wallet className="w-5 h-5 text-gray-400" />
          Portfolio
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Portfolio Summary */}
      {holdings.length > 0 && (
        <div className="mb-4 p-4 bg-black/20 rounded-lg border border-white/[0.05]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Value</p>
              <p className="text-lg font-bold text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Cost</p>
              <p className="text-lg font-bold text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/[0.1]">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-xs">Profit/Loss</p>
                <div className="flex items-center gap-2">
                  {profitLoss >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-white" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-gray-500" />
                  )}
                  <p className={`text-lg font-bold ${profitLoss >= 0 ? 'text-white' : 'text-gray-500'}`}>
                    ${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className={`text-sm ${profitLossPercent >= 0 ? 'text-white' : 'text-gray-500'}`}>
                    ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Holding Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-black/20 rounded-lg border border-white/[0.05]">
          <h4 className="text-sm font-semibold text-white mb-3">Add Holding</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'crypto' | 'stock' })}
                className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm"
              >
                <option value="crypto">Crypto</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Symbol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="BTC, ETH, AAPL, etc."
                className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bitcoin, Apple Inc., etc."
                className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Purchase Price (per unit)</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddHolding}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-white/[0.1] text-white rounded-lg hover:bg-white/[0.15] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holdings List */}
      {holdings.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No holdings yet</p>
          <p className="text-sm mt-2">Click the + button to add a holding</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {holdings.map((holding) => {
            const value = holding.quantity * holding.currentPrice;
            const cost = holding.quantity * holding.purchasePrice;
            const pl = value - cost;
            const plPercent = ((pl / cost) * 100);

            return (
              <div
                key={holding.id}
                className="p-3 bg-black/30 rounded-lg border border-white/[0.05] hover:bg-black/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {holding.image && (
                      <Image
                        src={holding.image}
                        alt={holding.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">{holding.name}</p>
                      <p className="text-xs text-gray-400">{holding.symbol}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveHolding(holding.id)}
                    className="p-1 hover:bg-white/[0.1] rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Quantity</p>
                    <p className="text-white font-semibold">{holding.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Current Price</p>
                    <p className="text-white font-semibold">${holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Purchase Price</p>
                    <p className="text-white font-semibold">${holding.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}/unit</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Value</p>
                    <p className="text-white font-semibold">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/[0.1]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">P/L</p>
                    <div className="flex items-center gap-1">
                      {pl >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-white" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-gray-500" />
                      )}
                      <p className={`text-sm font-bold ${pl >= 0 ? 'text-white' : 'text-gray-500'}`}>
                        ${pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className={`text-xs ${plPercent >= 0 ? 'text-white' : 'text-gray-500'}`}>
                        ({plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

