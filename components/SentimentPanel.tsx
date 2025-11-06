'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import type { CryptoData, StockData } from '@/lib/api';

interface SocialPost {
  title: string;
  content: string;
  score: number;
  comments: number;
  timestamp: number;
  source: string;
  url: string;
  author: string;
  sentiment: 'positive' | 'negative';
}

interface SentimentData {
  overall: 'positive' | 'negative';
  positive: number;
  negative: number;
  total: number;
}

interface SentimentPanelProps {
  asset: CryptoData | StockData;
  type: 'crypto' | 'stock';
}

export default function SentimentPanel({ asset, type }: SentimentPanelProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSentiment();
  }, [asset, type]);

  const loadSentiment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const query = type === 'stock' 
        ? (asset as StockData).symbol 
        : (asset as CryptoData).name;
      
      const response = await fetch(
        `/api/sentiment?query=${encodeURIComponent(query)}&type=${type}&limit=15`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setSentiment(data.sentiment || null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load social sentiment');
      }
    } catch (err: any) {
      console.error('Error loading sentiment:', err);
      setError('Failed to load social sentiment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-white">Social Sentiment</h3>
        </div>
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 text-sm">Analyzing social media posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-white">Social Sentiment</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadSentiment}
            className="px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-white">Social Sentiment</h3>
        </div>
        <button
          onClick={loadSentiment}
          className="text-xs text-gray-400 hover:text-white transition-colors"
          title="Refresh sentiment"
        >
          Refresh
        </button>
      </div>

      {/* Sentiment Summary */}
      {sentiment && (
        <div className={`p-4 rounded-lg border ${
          sentiment.overall === 'positive'
            ? 'bg-white/[0.1] border-white/[0.2]'
            : 'bg-gray-800/[0.5] border-gray-600/[0.5]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Overall Sentiment</span>
            <div className="flex items-center gap-2">
              {sentiment.overall === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-white" />
              ) : (
                <TrendingDown className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-bold ${
                sentiment.overall === 'positive' ? 'text-white' : 'text-gray-400'
              }`}>
                {sentiment.overall.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Positive:</span>
              <span className="text-white font-semibold">{sentiment.positive.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Negative:</span>
              <span className="text-gray-400 font-semibold">{sentiment.negative.toFixed(1)}%</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.05]">
              <p className="text-xs text-gray-500">
                Based on {sentiment.total} social media post{sentiment.total !== 1 ? 's' : ''} from Reddit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Social Posts */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {posts.length > 0 ? (
          posts.map((post, idx) => (
            <a
              key={idx}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-black/20 rounded-lg p-3 border border-white/[0.05] hover:bg-black/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-white text-sm hover:underline flex-1 line-clamp-2">
                  {post.title}
                </h5>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                  post.sentiment === 'positive' 
                    ? 'bg-white/[0.2] text-white' 
                    : 'bg-gray-500/[0.2] text-gray-400'
                }`}>
                  {post.sentiment === 'positive' ? 'POS' : 'NEG'}
                </span>
              </div>
              {post.content && post.content !== post.title && (
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                  {post.content}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>{post.source}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(post.timestamp)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {post.score}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.comments}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-gray-400 text-sm">No social media posts found</p>
            <p className="text-gray-500 text-xs mt-2">
              Try searching for a different asset or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

