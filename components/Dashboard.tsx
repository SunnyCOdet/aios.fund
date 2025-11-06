'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, DollarSign, BarChart3, RefreshCw } from 'lucide-react';
import CryptoCard from './CryptoCard';
import StockCard from './StockCard';
import PredictionPanel from './PredictionPanel';
import Watchlist from './Watchlist';
import StockSearch from './StockSearch';
import { getTopCryptos, searchCryptos } from '@/lib/api';
import type { CryptoData, StockData } from '@/lib/api';

export default function Dashboard() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<CryptoData | StockData | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<'crypto' | 'stock'>('crypto');
  const [searchError, setSearchError] = useState<string>('');

  useEffect(() => {
    loadCryptos();
  }, []);

  const loadCryptos = async () => {
    setLoading(true);
    setSearchError('');
    setSearchQuery(''); // Clear search query when reloading
    try {
      const data = await getTopCryptos(20);
      if (data && data.length > 0) {
        setCryptos(data);
      } else {
        setSearchError('No market data available. Please try again.');
      }
    } catch (error) {
      console.error('Error loading cryptos:', error);
      setSearchError('Failed to load market data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError('');
    
    if (query.length === 0) {
      // Reset to top cryptos when search is cleared
      await loadCryptos();
      return;
    }
    
    if (query.length <= 2) {
      // Don't search for queries shorter than 3 characters
      // Keep existing data
      return;
    }
    
    // Search for cryptocurrencies
    setLoading(true);
    try {
      const results = await searchCryptos(query);
      if (results && results.length > 0) {
        setCryptos(results);
      } else {
        // If no results, show error but keep existing data
        setSearchError('No cryptocurrencies found. Try a different search term.');
        // Don't clear the existing cryptos array
      }
    } catch (error) {
      console.error('Error searching cryptos:', error);
      setSearchError('Search failed. Please try again.');
      // Don't clear the existing cryptos array on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-white">
          Next Level Trading
        </h1>
        <p className="text-xl text-gray-400">
          Predict stocks & crypto with AI-powered insights
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cryptocurrencies (e.g., bitcoin, ethereum)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl glass-effect text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white"
          />
          {searchError && (
            <p className="mt-2 text-sm text-gray-400 text-center">{searchError}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Market Cap</p>
              <p className="text-2xl font-bold text-white">
                {cryptos.length > 0 
                  ? `$${(cryptos.reduce((sum, c) => sum + (c.market_cap || 0), 0) / 1e12).toFixed(2)}T`
                  : '--'
                }
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Top Gainers (24h)</p>
              <p className="text-2xl font-bold text-white">
                {cryptos.length > 0 
                  ? cryptos.filter(c => c.price_change_percentage_24h > 0).length
                  : '--'
                }
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-gray-400" />
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Top Losers (24h)</p>
              <p className="text-2xl font-bold text-white">
                {cryptos.length > 0 
                  ? cryptos.filter(c => c.price_change_percentage_24h < 0).length
                  : '--'
                }
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                  Market Overview
                </h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    loadCryptos();
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/[0.1]"
                  title="Reload market data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Reload</span>
                </button>
              </div>
              {cryptos.length === 0 && !loading ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="mb-4">No data available</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      loadCryptos();
                    }}
                    disabled={loading}
                    className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? 'Loading...' : 'Reload Market Data'}
                  </button>
                  {searchError && (
                    <p className="mt-4 text-sm text-gray-500">{searchError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {cryptos.map((crypto) => (
                    <CryptoCard
                      key={crypto.id}
                      crypto={crypto}
                      onClick={() => {
                        setSelectedAsset(crypto);
                        setSelectedAssetType('crypto');
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {selectedAsset && (
            <PredictionPanel asset={selectedAsset} type={selectedAssetType} />
          )}
          <StockSearch onSelect={(stock) => {
            setSelectedAsset(stock);
            setSelectedAssetType('stock');
          }} />
          <Watchlist />
        </div>
      </div>
    </div>
  );
}

