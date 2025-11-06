'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { CryptoData, StockData } from '@/lib/api';

interface PriceAlert {
  id: string;
  type: 'crypto' | 'stock';
  symbol: string;
  name: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  image?: string;
}

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'crypto' as 'crypto' | 'stock',
    symbol: '',
    name: '',
    condition: 'above' as 'above' | 'below',
    targetPrice: '',
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Load alerts from localStorage
    const saved = localStorage.getItem('priceAlerts');
    if (saved) {
      const savedAlerts = JSON.parse(saved);
      setAlerts(savedAlerts);
      checkAlerts(savedAlerts);
    }
  }, []);

  useEffect(() => {
    // Check alerts every 30 seconds
    if (alerts.length === 0) return;
    
    const interval = setInterval(() => {
      checkAlerts(alerts);
    }, 30000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  useEffect(() => {
    // Save to localStorage whenever alerts change
    if (alerts.length > 0) {
      localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    }
  }, [alerts]);

  const checkAlerts = async (currentAlerts: PriceAlert[]) => {
    if (checking) return;
    setChecking(true);

    try {
      const updatedAlerts = await Promise.all(
        currentAlerts.map(async (alert) => {
          if (alert.triggered) return alert;

          try {
            let currentPrice = alert.currentPrice;

            if (alert.type === 'crypto') {
              const response = await fetch(`/api/crypto?query=${encodeURIComponent(alert.symbol)}`);
              if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                  const crypto = data.find((c: CryptoData) => 
                    c.symbol.toLowerCase() === alert.symbol.toLowerCase() ||
                    c.id.toLowerCase() === alert.symbol.toLowerCase()
                  ) || data[0];
                  currentPrice = crypto.current_price;
                }
              }
            } else {
              const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(alert.symbol)}`);
              if (response.ok) {
                const stock: StockData = await response.json();
                currentPrice = stock.price;
              }
            }

            const shouldTrigger = 
              (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
              (alert.condition === 'below' && currentPrice <= alert.targetPrice);

            if (shouldTrigger && !alert.triggered) {
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Price Alert: ${alert.name}`, {
                  body: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
                  icon: alert.image,
                });
              }

              // Show browser alert as fallback
              alert(`🚨 Price Alert!\n\n${alert.name} (${alert.symbol}) is now ${alert.condition} $${alert.targetPrice.toLocaleString()}\n\nCurrent Price: $${currentPrice.toLocaleString()}`);

              return { ...alert, currentPrice, triggered: true };
            }

            return { ...alert, currentPrice };
          } catch (error) {
            console.error(`Error checking alert for ${alert.symbol}:`, error);
            return alert;
          }
        })
      );

      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setChecking(false);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleAddAlert = async () => {
    if (!formData.symbol || !formData.name || !formData.targetPrice) {
      alert('Please fill in all fields');
      return;
    }

    let currentPrice = 0;
    let image = '';

    try {
      if (formData.type === 'crypto') {
        const response = await fetch(`/api/crypto?query=${encodeURIComponent(formData.symbol)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const crypto = data.find((c: CryptoData) => 
              c.symbol.toLowerCase() === formData.symbol.toLowerCase() ||
              c.id.toLowerCase() === formData.symbol.toLowerCase()
            ) || data[0];
            currentPrice = crypto.current_price;
            image = crypto.image;
          }
        }
      } else {
        const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(formData.symbol)}`);
        if (response.ok) {
          const stock: StockData = await response.json();
          currentPrice = stock.price;
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }

    const newAlert: PriceAlert = {
      id: `${formData.type}-${formData.symbol}-${Date.now()}`,
      type: formData.type,
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      condition: formData.condition,
      targetPrice: parseFloat(formData.targetPrice),
      currentPrice,
      triggered: false,
      image: image || undefined,
    };

    setAlerts([...alerts, newAlert]);
    setFormData({
      type: 'crypto',
      symbol: '',
      name: '',
      condition: 'above',
      targetPrice: '',
    });
    setShowAddForm(false);
    requestNotificationPermission();
  };

  const handleRemoveAlert = (id: string) => {
    if (confirm('Are you sure you want to remove this alert?')) {
      setAlerts(alerts.filter(a => a.id !== id));
    }
  };

  const handleResetAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, triggered: false } : a));
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <Bell className="w-5 h-5 text-gray-400" />
          Price Alerts
        </h3>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            requestNotificationPermission();
          }}
          className="p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Add Alert Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-black/20 rounded-lg border border-white/[0.05]">
          <h4 className="text-sm font-semibold text-white mb-3">Create Alert</h4>
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
                <label className="text-xs text-gray-400 mb-1 block">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'above' | 'below' })}
                  className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target Price</label>
                <input
                  type="number"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddAlert}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                Create Alert
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

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No alerts set</p>
          <p className="text-sm mt-2">Click the + button to create a price alert</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const isTriggered = alert.condition === 'above' 
              ? alert.currentPrice >= alert.targetPrice
              : alert.currentPrice <= alert.targetPrice;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-colors ${
                  alert.triggered || isTriggered
                    ? 'bg-white/[0.15] border-white/[0.3]'
                    : 'bg-black/30 border-white/[0.05]'
                } hover:bg-black/40`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {alert.image && (
                      <Image
                        src={alert.image}
                        alt={alert.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">{alert.name}</p>
                      <p className="text-xs text-gray-400">{alert.symbol}</p>
                    </div>
                  </div>
                  {(alert.triggered || isTriggered) && (
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                  )}
                  <button
                    onClick={() => handleRemoveAlert(alert.id)}
                    className="p-1 hover:bg-white/[0.1] rounded transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Alert when price is</span>
                    <span className="text-white font-semibold">
                      {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white font-semibold">
                      ${alert.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                  {(alert.triggered || isTriggered) && (
                    <div className="mt-2 pt-2 border-t border-white/[0.1]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">Alert Triggered!</span>
                        {alert.triggered && (
                          <button
                            onClick={() => handleResetAlert(alert.id)}
                            className="text-xs text-gray-400 hover:text-white underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

