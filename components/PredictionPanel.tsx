'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import PriceChart from './PriceChart';
import { getCryptoHistory } from '@/lib/api';
import { calculateIndicators } from '@/lib/indicators';
import type { CryptoData, StockData } from '@/lib/api';

interface PredictionPanelProps {
  asset: CryptoData | StockData;
  type: 'crypto' | 'stock';
}

export default function PredictionPanel({ asset, type }: PredictionPanelProps) {
  const [indicators, setIndicators] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [asset]);

  const loadData = async () => {
    setLoading(true);
    let history = [];

    try {
      if (type === 'crypto') {
        const crypto = asset as CryptoData;
        history = await getCryptoHistory(crypto.id, 30);
      } else {
        const stock = asset as StockData;
        // Use API route for stock history to avoid CORS issues
        const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(stock.symbol)}&action=history`);
        if (response.ok) {
          history = await response.json();
        } else {
          const error = await response.json();
          console.error('Error fetching stock history:', error);
        }
      }

      if (history && history.length > 0) {
        // Ensure we have enough data points for indicators (need at least 50)
        if (history.length >= 50) {
          setHistoricalData(history);
          const calculated = calculateIndicators(history);
          setIndicators(calculated);
        } else {
          // Not enough data, but still show what we have
          setHistoricalData(history);
          const calculated = calculateIndicators(history);
          setIndicators(calculated);
        }
      } else {
        // If no history data, show message but don't create fake data
        console.warn('No historical data available for indicators');
        setHistoricalData([]);
        // Set default indicators
        const currentPrice = type === 'stock' ? (asset as StockData).price : (asset as CryptoData).current_price;
        setIndicators({
          rsi: 50,
          macd: { value: 0, signal: 0, histogram: 0 },
          sma20: currentPrice,
          sma50: currentPrice,
          sma200: currentPrice,
          trend: 'neutral',
          recommendation: 'hold',
          confidence: 0,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default indicators on error
      const currentPrice = type === 'stock' ? (asset as StockData).price : (asset as CryptoData).current_price;
      setHistoricalData([]);
      setIndicators({
        rsi: 50,
        macd: { value: 0, signal: 0, histogram: 0 },
        sma20: currentPrice,
        sma50: currentPrice,
        sma200: currentPrice,
        trend: 'neutral',
        recommendation: 'hold',
        confidence: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!indicators) return null;

  const recommendationColors = {
    buy: 'bg-white/[0.1] text-white border-white/[0.2]',
    sell: 'bg-gray-800 text-gray-400 border-gray-600',
    hold: 'bg-white/[0.05] text-gray-300 border-white/[0.1]',
  };

  return (
    <div className="glass-effect rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 text-white">
          {type === 'crypto' ? (asset as CryptoData).name : (asset as StockData).name}
        </h3>
        <p className="text-gray-400 text-sm">
          AI-Powered Prediction Analysis
        </p>
      </div>

      {/* Recommendation */}
      <div
        className={`p-4 rounded-lg border ${recommendationColors[indicators.recommendation]}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold uppercase text-white">{indicators.recommendation}</span>
          <span className="text-sm text-gray-400">{indicators.confidence.toFixed(0)}% confidence</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full ${
              indicators.recommendation === 'buy'
                ? 'bg-white'
                : indicators.recommendation === 'sell'
                ? 'bg-gray-600'
                : 'bg-gray-400'
            }`}
            style={{ width: `${indicators.confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Chart */}
      <PriceChart data={historicalData} />

      {/* Technical Indicators */}
      <div className="space-y-4">
        <h4 className="font-bold flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-gray-400" />
          Technical Indicators
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
            <p className="text-gray-400 text-xs mb-1">RSI (14)</p>
            <p className="text-lg font-bold text-white">
              {indicators.rsi.toFixed(2)}
              <span className="text-xs ml-2 text-gray-400">
                {indicators.rsi > 70
                  ? 'Overbought'
                  : indicators.rsi < 30
                  ? 'Oversold'
                  : 'Neutral'}
              </span>
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
            <p className="text-gray-400 text-xs mb-1">Trend</p>
            <p className="text-lg font-bold capitalize flex items-center gap-2 text-white">
              {indicators.trend === 'bullish' ? (
                <TrendingUp className="w-4 h-4 text-gray-400" />
              ) : indicators.trend === 'bearish' ? (
                <TrendingDown className="w-4 h-4 text-gray-400" />
              ) : (
                <Activity className="w-4 h-4 text-gray-400" />
              )}
              {indicators.trend}
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
            <p className="text-gray-400 text-xs mb-1">SMA (20)</p>
            <p className="text-lg font-bold text-white">
              ${indicators.sma20.toFixed(2)}
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
            <p className="text-gray-400 text-xs mb-1">SMA (50)</p>
            <p className="text-lg font-bold text-white">
              ${indicators.sma50.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
          <p className="text-gray-400 text-xs mb-1">MACD</p>
          <div className="space-y-1">
            <p className="text-sm text-white">
              Value: <span className="font-bold">{indicators.macd.value.toFixed(4)}</span>
            </p>
            <p className="text-sm text-white">
              Signal: <span className="font-bold">{indicators.macd.signal.toFixed(4)}</span>
            </p>
            <p
              className={`text-sm ${
                indicators.macd.histogram > 0 ? 'text-white' : 'text-gray-500'
              }`}
            >
              Histogram: <span className="font-bold">{indicators.macd.histogram.toFixed(4)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

