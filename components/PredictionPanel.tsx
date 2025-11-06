'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Newspaper, Brain, Sparkles, Loader2 } from 'lucide-react';
import PriceChart from './PriceChart';
import ApiKeySettings from './ApiKeySettings';
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
  const [news, setNews] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'indicators' | 'news' | 'ai'>('indicators');

  useEffect(() => {
    // Reset all states when asset changes
    setAiAnalysis(null);
    setNews([]);
    setSentiment(null);
    setLoadingAI(false);
    setActiveTab('indicators'); // Reset to indicators tab when asset changes
    loadData();
  }, [asset]);

  const loadData = async () => {
    setLoading(true);
    // Clear previous AI analysis when loading new data
    setAiAnalysis(null);
    let history = [];

    try {
      if (type === 'crypto') {
        const crypto = asset as CryptoData;
        history = await getCryptoHistory(crypto.id, 30);
      } else {
        const stock = asset as StockData;
        const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(stock.symbol)}&action=history`);
        if (response.ok) {
          history = await response.json();
        }
      }

      if (history && history.length > 0) {
        setHistoricalData(history);
        const calculated = calculateIndicators(history);
        setIndicators(calculated);
      } else {
        const currentPrice = type === 'stock' ? (asset as StockData).price : (asset as CryptoData).current_price;
        setIndicators({
          rsi: 50,
          macd: { value: 0, signal: 0, histogram: 0 },
          sma20: currentPrice,
          sma50: currentPrice,
          sma200: currentPrice,
          bollinger: { upper: currentPrice, middle: currentPrice, lower: currentPrice },
          stochastic: { k: 50, d: 50 },
          adx: 25,
          trend: 'neutral',
          recommendation: 'hold',
          confidence: 0,
        });
      }

      // Load news and sentiment
      await loadNews();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      const query = type === 'stock' 
        ? (asset as StockData).symbol 
        : (asset as CryptoData).name;
      
      // Fetch more news articles with asset type for smart query generation
      const response = await fetch(`/api/news?query=${encodeURIComponent(query)}&limit=20&type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data.articles || []);
        setSentiment(data.sentiment || {});
      }
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadAIAnalysis = async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('Please enter your Gemini API key in the settings above.');
      return;
    }

    setLoadingAI(true);
    try {
      const assetName = type === 'stock' ? (asset as StockData).name : (asset as CryptoData).name;
      const assetSymbol = type === 'stock' ? (asset as StockData).symbol : (asset as CryptoData).symbol.toUpperCase();
      const currentPrice = type === 'stock' ? (asset as StockData).price : (asset as CryptoData).current_price;
      const priceChange = type === 'stock' 
        ? (asset as StockData).change 
        : (asset as CryptoData).current_price * ((asset as CryptoData).price_change_percentage_24h / 100);
      const priceChangePercent = type === 'stock' 
        ? (asset as StockData).changePercent 
        : (asset as CryptoData).price_change_percentage_24h;

      // Scrape full article content from top news articles
      const newsWithContent = await Promise.all(
        news.slice(0, 5).map(async (article) => {
          if (article.url && article.url !== '#') {
            try {
              const scrapeResponse = await fetch('/api/scrape-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: article.url }),
              });
              
              if (scrapeResponse.ok) {
                const scraped = await scrapeResponse.json();
                return {
                  ...article,
                  fullContent: scraped.content || article.description,
                };
              }
            } catch (error) {
              console.error('Error scraping article:', error);
            }
          }
          return {
            ...article,
            fullContent: article.description, // Fallback to description
          };
        })
      );

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          assetName,
          assetSymbol,
          currentPrice,
          priceChange,
          priceChangePercent,
          indicators,
          news: newsWithContent,
          sentiment,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiAnalysis(analysis);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate AI analysis');
      }
    } catch (error: any) {
      console.error('Error loading AI analysis:', error);
      alert('Failed to generate AI analysis. Please check your API key.');
    } finally {
      setLoadingAI(false);
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

  const assetName = type === 'crypto' ? (asset as CryptoData).name : (asset as StockData).name;
  const currentPrice = type === 'stock' ? (asset as StockData).price : (asset as CryptoData).current_price;

  return (
    <div className="space-y-6">
      <ApiKeySettings />

      <div className="glass-effect rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-2xl font-bold mb-2 text-white">{assetName}</h3>
          <p className="text-gray-400 text-sm">AI-Powered Prediction Analysis</p>
        </div>

        {/* Recommendation */}
        <div className={`p-4 rounded-lg border ${recommendationColors[indicators.recommendation]}`}>
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

        {/* Sentiment Summary */}
        {sentiment && (
          <div className="p-3 rounded-lg bg-black/20 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">News Sentiment</span>
              <span className={`text-sm font-bold ${
                sentiment.overall === 'positive' ? 'text-white' : 'text-gray-500'
              }`}>
                {sentiment.overall.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Positive:</span>
                <span className="text-white font-semibold">{sentiment.positive.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Negative:</span>
                <span className="text-gray-500 font-semibold">{sentiment.negative.toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              <p className="text-xs text-gray-500">
                Based on {news.length} article{news.length !== 1 ? 's' : ''} analyzed using keyword matching
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <PriceChart data={historicalData} />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/[0.1]">
          <button
            onClick={() => setActiveTab('indicators')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'indicators'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Indicators
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'news'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 inline mr-2" />
            News ({news.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              // Always reload AI analysis when switching to AI tab
              // This ensures fresh analysis for the current asset
              if (!loadingAI) {
                loadAIAnalysis();
              }
            }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'ai'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            AI Analysis
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'indicators' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">RSI (14)</p>
                <p className="text-lg font-bold text-white">
                  {indicators.rsi.toFixed(2)}
                  <span className="text-xs ml-2 text-gray-400">
                    {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
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
                <p className="text-lg font-bold text-white">${indicators.sma20.toFixed(2)}</p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">SMA (50)</p>
                <p className="text-lg font-bold text-white">${indicators.sma50.toFixed(2)}</p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">Stochastic %K</p>
                <p className="text-lg font-bold text-white">{indicators.stochastic.k.toFixed(2)}</p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">Stochastic %D</p>
                <p className="text-lg font-bold text-white">{indicators.stochastic.d.toFixed(2)}</p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">ADX</p>
                <p className="text-lg font-bold text-white">
                  {indicators.adx.toFixed(2)}
                  <span className="text-xs ml-2 text-gray-400">
                    {indicators.adx > 25 ? 'Strong' : 'Weak'}
                  </span>
                </p>
              </div>

              <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
                <p className="text-gray-400 text-xs mb-1">Bollinger Upper</p>
                <p className="text-lg font-bold text-white">${indicators.bollinger.upper.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
              <p className="text-gray-400 text-xs mb-1">Bollinger Bands</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">Upper: <span className="font-bold">${indicators.bollinger.upper.toFixed(2)}</span></p>
                <p className="text-white">Middle: <span className="font-bold">${indicators.bollinger.middle.toFixed(2)}</span></p>
                <p className="text-white">Lower: <span className="font-bold">${indicators.bollinger.lower.toFixed(2)}</span></p>
                <p className="text-gray-400 text-xs mt-2">
                  Current: ${currentPrice.toFixed(2)} - {
                    currentPrice > indicators.bollinger.upper ? 'Above Upper (Overbought)' :
                    currentPrice < indicators.bollinger.lower ? 'Below Lower (Oversold)' :
                    'Within Bands (Neutral)'
                  }
                </p>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05]">
              <p className="text-gray-400 text-xs mb-1">MACD</p>
              <div className="space-y-1">
                <p className="text-sm text-white">Value: <span className="font-bold">{indicators.macd.value.toFixed(4)}</span></p>
                <p className="text-sm text-white">Signal: <span className="font-bold">{indicators.macd.signal.toFixed(4)}</span></p>
                <p className={`text-sm ${indicators.macd.histogram > 0 ? 'text-white' : 'text-gray-500'}`}>
                  Histogram: <span className="font-bold">{indicators.macd.histogram.toFixed(4)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Searching news sources...</p>
                <p className="text-xs text-gray-500 mt-2">Bloomberg, Reuters, CNBC, FT, MarketWatch, WSJ, Forbes, Seeking Alpha, Investing.com, Barron's, CoinDesk, CoinTelegraph</p>
              </div>
            ) : news.length > 0 ? (
              <>
                <div className="bg-black/20 rounded-lg p-3 border border-white/[0.05] mb-4">
                  <p className="text-xs text-gray-400 mb-2">Searched Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'MarketWatch', 'Yahoo Finance', 'Wall Street Journal', 'Forbes', 'Seeking Alpha', 'Investing.com', 'Barron\'s', 'CoinDesk', 'CoinTelegraph'].map((source) => (
                      <span key={source} className="text-xs px-2 py-1 bg-white/[0.05] rounded text-gray-400">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
                {news.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-black/20 rounded-lg p-3 border border-white/[0.05] hover:bg-black/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-white text-sm hover:underline flex-1">{article.title}</h5>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                        article.sentiment === 'positive' 
                          ? 'bg-white/[0.2] text-white' 
                          : 'bg-gray-500/[0.2] text-gray-400'
                      }`}>
                        {article.sentiment === 'positive' ? 'POSITIVE' : 'NEGATIVE'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{article.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{article.source}</span>
                      <span className="text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </a>
                ))}
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">No news available</p>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            {loadingAI ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Scraping articles and generating AI analysis...</p>
                <p className="text-xs text-gray-500 mt-2">This may take a moment...</p>
              </div>
            ) : aiAnalysis && !loading ? (
              <>
                <div className="bg-black/20 rounded-lg p-4 border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h4 className="font-bold text-white">Summary</h4>
                  </div>
                  <p className="text-gray-300 text-sm">{aiAnalysis.summary}</p>
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-white/[0.05]">
                  <h4 className="font-bold text-white mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.keyPoints?.map((point: string, idx: number) => (
                      <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-white mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-white/[0.05]">
                  <h4 className="font-bold text-white mb-2">Risk Assessment</h4>
                  <p className="text-gray-300 text-sm">{aiAnalysis.riskAssessment}</p>
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-white/[0.05]">
                  <h4 className="font-bold text-white mb-2">Market Outlook</h4>
                  <p className="text-gray-300 text-sm">{aiAnalysis.marketOutlook}</p>
                </div>

                <div className="bg-white/[0.1] rounded-lg p-4 border border-white/[0.2]">
                  <h4 className="font-bold text-white mb-2">AI Recommendation</h4>
                  <p className="text-white text-sm">{aiAnalysis.recommendation}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-400 mb-4">Click to generate AI-powered analysis</p>
                <button
                  onClick={loadAIAnalysis}
                  className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                  Generate Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
