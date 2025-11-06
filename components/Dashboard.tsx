'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, DollarSign, BarChart3, RefreshCw } from 'lucide-react';
import CryptoCard from './CryptoCard';
import StockCard from './StockCard';
import PredictionPanel from './PredictionPanel';
import Watchlist from './Watchlist';
import StockSearch from './StockSearch';
import Portfolio from './Portfolio';
import PriceAlerts from './PriceAlerts';
import SentimentPanel from './SentimentPanel';
import type { CryptoData, StockData } from '@/lib/api';

export default function Dashboard() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<CryptoData | StockData | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<'crypto' | 'stock'>('crypto');
  const [searchError, setSearchError] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'crypto' | 'stock'>('all');

  useEffect(() => {
    loadCryptos();
  }, []);

  const loadCryptos = async () => {
    setLoading(true);
    setSearchError('');
    setSearchQuery(''); // Clear search query when reloading
    try {
      const response = await fetch('/api/crypto?action=top&limit=20');
      const data = await response.json();
      
      // Check if response has an error
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch market data');
      }
      
      // Check if data is an array with items
      if (Array.isArray(data) && data.length > 0) {
        setCryptos(data);
      } else {
        setSearchError('No market data available. Please try again.');
        setCryptos([]);
      }
    } catch (error: any) {
      console.error('Error loading cryptos:', error);
      setSearchError(error.message || 'Failed to load market data. Please check your connection.');
      setCryptos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError('');
    
    if (query.length === 0) {
      // Reset to top cryptos when search is cleared, but keep search type
      setStocks([]);
      // Only reset to 'all' if it was 'all', otherwise keep the selected type
      if (searchType === 'stock') {
        // If stocks is selected but search is cleared, show empty stocks
        setCryptos([]);
      } else {
        await loadCryptos();
      }
      return;
    }
    
    if (query.length <= 2) {
      // Don't search for queries shorter than 3 characters
      // Keep existing data
      return;
    }
    
    // Search based on selected type
    setIsSearching(true);
    setLoading(true);
    
    try {
      const promises: Promise<Response>[] = [];
      
      // Only search crypto if type is 'all' or 'crypto'
      if (searchType === 'all' || searchType === 'crypto') {
        promises.push(fetch(`/api/crypto?query=${encodeURIComponent(query)}`));
      }
      
      // Only search stocks if type is 'all' or 'stock'
      if (searchType === 'all' || searchType === 'stock') {
        promises.push(fetch(`/api/stocks?symbol=${encodeURIComponent(query.trim().toUpperCase())}`));
      }

      const responses = await Promise.allSettled(promises);

      const cryptoResults: CryptoData[] = [];
      const stockResults: StockData[] = [];
      let responseIndex = 0;

      // Process crypto results
      if (searchType === 'all' || searchType === 'crypto') {
        const cryptoResponse = responses[responseIndex++];
        if (cryptoResponse.status === 'fulfilled') {
          try {
            const cryptoData = await cryptoResponse.value.json();
            if (Array.isArray(cryptoData) && cryptoData.length > 0) {
              cryptoResults.push(...cryptoData);
            }
          } catch (e) {
            // Silently handle JSON parse errors
          }
        }
      }

      // Process stock results
      if (searchType === 'all' || searchType === 'stock') {
        const stockResponse = responses[responseIndex++];
        if (stockResponse.status === 'fulfilled') {
          try {
            const stockData = await stockResponse.value.json();
            if (stockData && !stockData.error && stockData.symbol) {
              stockResults.push(stockData);
            }
          } catch (e) {
            // Silently handle JSON parse errors
          }
        }
      }

      setCryptos(cryptoResults);
      setStocks(stockResults);

      // Show error only if no results found
      if (cryptoResults.length === 0 && stockResults.length === 0) {
        // Check for common typos
        const queryUpper = query.trim().toUpperCase();
        const commonTypos: Record<string, string> = {
          'APPL': 'AAPL', // Common typo for Apple
        };
        
        let suggestion = '';
        if (commonTypos[queryUpper]) {
          suggestion = ` Did you mean ${commonTypos[queryUpper]}?`;
        }
        
        const typeHint = searchType === 'crypto' 
          ? 'Try searching for a crypto name/symbol (e.g., bitcoin, BTC).'
          : searchType === 'stock'
          ? 'Try searching for a stock symbol (e.g., AAPL, TSLA).'
          : 'Try searching for a crypto name/symbol (e.g., bitcoin, BTC) or stock symbol (e.g., AAPL, TSLA).';
        
        setSearchError(`No results found for "${query}".${suggestion} ${typeHint}`);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setLoading(false);
      setIsSearching(false);
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

      {/* Unified Search Bar */}
      <div className="mb-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Type Selector */}
          <div className="flex gap-2 mb-3 justify-center">
            <button
              onClick={() => {
                setSearchType('all');
                if (searchQuery && searchQuery.length > 2) {
                  handleSearch(searchQuery);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                searchType === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/[0.1] text-gray-300 hover:bg-white/[0.15]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setSearchType('crypto');
                if (searchQuery && searchQuery.length > 2) {
                  handleSearch(searchQuery);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                searchType === 'crypto'
                  ? 'bg-white text-black'
                  : 'bg-white/[0.1] text-gray-300 hover:bg-white/[0.15]'
              }`}
            >
              Crypto
            </button>
            <button
              onClick={() => {
                setSearchType('stock');
                if (searchQuery && searchQuery.length > 2) {
                  handleSearch(searchQuery);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                searchType === 'stock'
                  ? 'bg-white text-black'
                  : 'bg-white/[0.1] text-gray-300 hover:bg-white/[0.15]'
              }`}
            >
              Stocks
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={
                searchType === 'crypto'
                  ? 'Search cryptocurrencies (e.g., bitcoin, BTC)...'
                  : searchType === 'stock'
                  ? 'Search stocks (e.g., AAPL, TSLA)...'
                  : 'Search crypto or stocks (e.g., bitcoin, BTC, AAPL, TSLA)...'
              }
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl glass-effect text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {searchError && (
            <p className="mt-2 text-sm text-gray-400 text-center">{searchError}</p>
          )}
          {!searchError && (cryptos.length > 0 || stocks.length > 0) && searchQuery && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              {searchType === 'crypto' && `Found ${cryptos.length} crypto${cryptos.length !== 1 ? 's' : ''}`}
              {searchType === 'stock' && `Found ${stocks.length} stock${stocks.length !== 1 ? 's' : ''}`}
              {searchType === 'all' && `Found ${cryptos.length} crypto${cryptos.length !== 1 ? 's' : ''} and ${stocks.length} stock${stocks.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">
                {searchType === 'crypto' ? 'Crypto Market Cap' : 
                 searchType === 'stock' ? 'Stocks Market Cap' : 
                 'Total Market Cap'}
              </p>
              <p className="text-2xl font-bold text-white">
                {(() => {
                  let totalMarketCap = 0;
                  
                  // Only calculate based on what's actually being displayed
                  if (searchType === 'crypto') {
                    // Only crypto
                    if (cryptos.length > 0) {
                      totalMarketCap = cryptos.reduce((sum, c) => sum + (c.market_cap || 0), 0);
                    }
                  } else if (searchType === 'stock') {
                    // Only stocks - sum all stock market caps
                    if (stocks.length > 0) {
                      totalMarketCap = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
                      // If no market cap data available, show N/A
                      if (totalMarketCap === 0) {
                        // Check if any stock has market cap data
                        const hasMarketCap = stocks.some(s => s.marketCap && s.marketCap > 0);
                        if (!hasMarketCap) {
                          return 'N/A';
                        }
                      }
                    }
                  } else {
                    // All - combine both
                    if (cryptos.length > 0) {
                      totalMarketCap += cryptos.reduce((sum, c) => sum + (c.market_cap || 0), 0);
                    }
                    if (stocks.length > 0) {
                      totalMarketCap += stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
                    }
                  }
                  
                  if (totalMarketCap > 0) {
                    if (totalMarketCap >= 1e12) {
                      return `$${(totalMarketCap / 1e12).toFixed(2)}T`;
                    } else if (totalMarketCap >= 1e9) {
                      return `$${(totalMarketCap / 1e9).toFixed(2)}B`;
                    } else if (totalMarketCap >= 1e6) {
                      return `$${(totalMarketCap / 1e6).toFixed(2)}M`;
                    } else {
                      return `$${totalMarketCap.toLocaleString()}`;
                    }
                  }
                  
                  return '--';
                })()}
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
                {(() => {
                  let gainers = 0;
                  
                  // Only count based on search type
                  if (searchType === 'crypto') {
                    if (cryptos.length > 0) {
                      gainers = cryptos.filter(c => c.price_change_percentage_24h > 0).length;
                    }
                  } else if (searchType === 'stock') {
                    if (stocks.length > 0) {
                      gainers = stocks.filter(s => s.changePercent > 0).length;
                    }
                  } else {
                    // All - count both
                    if (cryptos.length > 0) {
                      gainers += cryptos.filter(c => c.price_change_percentage_24h > 0).length;
                    }
                    if (stocks.length > 0) {
                      gainers += stocks.filter(s => s.changePercent > 0).length;
                    }
                  }
                  
                  // For stocks, even if it's just one, show the count
                  return gainers > 0 ? gainers : (stocks.length > 0 || cryptos.length > 0 ? 0 : '--');
                })()}
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
                {(() => {
                  let losers = 0;
                  
                  // Only count based on search type
                  if (searchType === 'crypto') {
                    if (cryptos.length > 0) {
                      losers = cryptos.filter(c => c.price_change_percentage_24h < 0).length;
                    }
                  } else if (searchType === 'stock') {
                    if (stocks.length > 0) {
                      losers = stocks.filter(s => s.changePercent < 0).length;
                    }
                  } else {
                    // All - count both
                    if (cryptos.length > 0) {
                      losers += cryptos.filter(c => c.price_change_percentage_24h < 0).length;
                    }
                    if (stocks.length > 0) {
                      losers += stocks.filter(s => s.changePercent < 0).length;
                    }
                  }
                  
                  // For stocks, even if it's just one, show the count
                  return losers > 0 ? losers : (stocks.length > 0 || cryptos.length > 0 ? 0 : '--');
                })()}
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
                  {searchQuery ? 'Search Results' : 'Market Overview'}
                </h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchQuery('');
                    setStocks([]);
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
              {cryptos.length === 0 && stocks.length === 0 && !loading && !searchQuery ? (
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
                  {/* Show stocks first if searching and type is 'all' or 'stock' */}
                  {stocks.length > 0 && (searchType === 'all' || searchType === 'stock') && (
                    <>
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Stocks</h3>
                      </div>
                      {stocks.map((stock) => (
                        <StockCard
                          key={stock.symbol}
                          stock={stock}
                          onClick={() => {
                            setSelectedAsset(stock);
                            setSelectedAssetType('stock');
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Show cryptos if type is 'all' or 'crypto' */}
                  {cryptos.length > 0 && (searchType === 'all' || searchType === 'crypto') && (
                    <>
                      {stocks.length > 0 && searchType === 'all' && <div className="mt-6 mb-2" />}
                      <div className="mb-2">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Cryptocurrencies</h3>
                      </div>
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
                    </>
                  )}
                  
                  {/* Show message when searching but no results */}
                  {searchQuery && cryptos.length === 0 && stocks.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-400">
                      <p className="mb-2">No results found for "{searchQuery}"</p>
                      {searchQuery.trim().toUpperCase() === 'APPL' && (
                        <p className="text-sm text-white mb-2">
                          💡 Did you mean <button onClick={() => handleSearch('AAPL')} className="underline hover:text-gray-300">AAPL</button>?
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Try searching for a crypto name/symbol (e.g., bitcoin, BTC) or stock symbol (e.g., AAPL, TSLA)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {selectedAsset && (
            <>
              <PredictionPanel asset={selectedAsset} type={selectedAssetType} />
              <SentimentPanel asset={selectedAsset} type={selectedAssetType} />
            </>
          )}
          <Portfolio />
          <PriceAlerts />
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

