import axios from 'axios';
import { getMarketNews as agentGetMarketNews } from './news-agent';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  fullContent?: string; // Full article content after scraping
}

// Trusted news domains - only news from these domains will be shown
const TRUSTED_DOMAINS = [
  // Major Financial News
  'bloomberg.com', 'reuters.com', 'ft.com', 'wsj.com', 'cnbc.com',
  'marketwatch.com', 'finance.yahoo.com', 'yahoo.com', 'investing.com',
  'seekingalpha.com', 'barrons.com', 'forbes.com', 'fortune.com',
  'businessinsider.com', 'economist.com',
  
  // Tech & Crypto News
  'coindesk.com', 'cointelegraph.com', 'theblock.co', 'decrypt.co',
  'cryptoslate.com', 'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com',
  
  // Traditional News (for financial coverage)
  'bbc.com', 'bbc.co.uk', 'cnn.com', 'ap.org', 'apnews.com',
  'nytimes.com', 'washingtonpost.com', 'usatoday.com',
  
  // Financial Data Providers
  'morningstar.com', 'zacks.com', 'fool.com', 'benzinga.com',
  
  // Exchange & Institutional
  'nasdaq.com', 'nyse.com', 'sec.gov', 'federalreserve.gov',
  
  // Additional trusted domains
  'investopedia.com', 'fool.co.uk', 'bloombergterminal.com',
  'financialexpress.com', 'businesswire.com', 'prnewswire.com',
];

// Untrusted/blacklisted domains
const UNTRUSTED_DOMAINS = [
  'reddit.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
  'youtube.com', 'tiktok.com', 'medium.com', 'blogspot.com',
  'wordpress.com', 'tumblr.com', 'pinterest.com',
];

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    if (!url || url === '#') return '';
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return '';
  }
}

// Normalize source name for comparison
function normalizeSourceName(source: string): string {
  return source
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Check if source is trusted based on URL domain or source name
function isTrustedSource(source: string, url?: string): boolean {
  if (!source && !url) return false;
  
  // First check URL domain if available
  if (url) {
    const domain = extractDomain(url);
    if (!domain) return false;
    
    // Check blacklist first
    if (UNTRUSTED_DOMAINS.some(untrusted => domain.includes(untrusted))) {
      return false;
    }
    
    // Check trusted domains
    if (TRUSTED_DOMAINS.some(trusted => domain.includes(trusted))) {
      return true;
    }
  }
  
  // Fallback: check source name
  const normalized = normalizeSourceName(source || '');
  if (!normalized) return false;
  
  // Trusted source names (case-insensitive matching)
  const trustedNames = [
    'bloomberg', 'reuters', 'financial times', 'wall street journal', 'wsj',
    'cnbc', 'marketwatch', 'yahoo finance', 'investing', 'seeking alpha',
    'barrons', 'forbes', 'fortune', 'business insider', 'economist',
    'coindesk', 'cointelegraph', 'the block', 'decrypt', 'cryptoslate',
    'techcrunch', 'the verge', 'ars technica', 'wired',
    'bbc', 'cnn', 'associated press', 'ap', 'new york times', 'washington post',
    'morningstar', 'zacks', 'motley fool', 'fool', 'benzinga',
    'nasdaq', 'nyse', 'sec', 'federal reserve', 'google news', 'alpha vantage',
  ];
  
  return trustedNames.some(trusted => 
    normalized.includes(trusted) || trusted.includes(normalized)
  );
}

// Price-moving keywords that indicate significant news
const PRICE_MOVING_KEYWORDS = [
  // Earnings & Financial Reports
  'earnings', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'revenue', 'profit', 'loss', 'guidance',
  'forecast', 'beat', 'miss', 'eps', 'financial results', 'annual report',
  
  // Partnerships & Integrations
  'partnership', 'integration', 'collaboration', 'alliance', 'deal', 'merger', 'acquisition',
  'partners with', 'teams up', 'joins forces',
  
  // Product Launches & Updates
  'launch', 'release', 'introduces', 'unveils', 'announces', 'rolls out', 'debuts',
  
  // Regulatory & Legal
  'sec', 'regulation', 'regulatory', 'approval', 'lawsuit', 'legal', 'investigation',
  'fine', 'settlement', 'compliance',
  
  // Market Events
  'ipo', 'listing', 'delisting', 'stock split', 'dividend', 'buyback', 'share',
  'trading halt', 'circuit breaker',
  
  // Major Announcements
  'ceo', 'executive', 'leadership', 'restructuring', 'layoffs', 'expansion',
  'closes', 'opens', 'factory', 'facility',
  
  // Crypto-Specific
  'adoption', 'institutional', 'etf', 'halving', 'fork', 'upgrade', 'hard fork',
  'mainnet', 'testnet', 'staking', 'burn', 'tokenomics',
  
  // Technology & Development
  'protocol', 'upgrade', 'update', 'patch', 'vulnerability', 'security', 'hack',
  
  // Market Analysis
  'price target', 'analyst', 'upgrade', 'downgrade', 'rating', 'outlook', 'bullish', 'bearish'
];

// Irrelevant keywords that indicate "trash news"
const IRRELEVANT_KEYWORDS = [
  'celebrity', 'gossip', 'rumor', 'unconfirmed', 'speculation',
  'memecoin', 'shiba', 'dogecoin', 'joke', 'prank',
  'social media', 'tweet', 'reddit', 'forum', 'discord',
  'price prediction', 'will hit', 'going to', 'might reach'
];

// Check if article is price-moving news
function isPriceMovingNews(article: NewsArticle): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Check for irrelevant keywords first
  const hasIrrelevant = IRRELEVANT_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasIrrelevant) return false;
  
  // Check for price-moving keywords
  const hasPriceMoving = PRICE_MOVING_KEYWORDS.some(keyword => text.includes(keyword));
  
  // Also check for financial numbers (earnings, revenue, etc.)
  const hasFinancialNumbers = /\$[\d,]+(?:million|billion|trillion|m|b|t)?/i.test(text) ||
                              /\d+%/.test(text) ||
                              /(?:revenue|profit|loss|earnings).*[\d,]+/i.test(text);
  
  return hasPriceMoving || hasFinancialNumbers;
}

// Fetch news using headless browser agent (primary method)
export async function getMarketNews(
  query: string,
  limit: number = 20,
  assetType?: 'crypto' | 'stock'
): Promise<NewsArticle[]> {
  try {
    // Use headless browser agent to search news websites directly
    // This avoids rate limiting and gets results from verified sources
    const articles = await agentGetMarketNews(query, limit, assetType);
    
    if (articles && articles.length > 0) {
      // Analyze sentiment for articles
      const articlesWithSentiment = articles.map(article => ({
        ...article,
        sentiment: analyzeArticleSentiment(article) as 'positive' | 'negative' | 'neutral',
      }));
      
      return articlesWithSentiment;
    }

    // Fallback to API sources if agent fails
    return await getMarketNewsFallback(query, limit);
  } catch (error) {
    console.error('[News] Error with agent, using fallback:', error);
    return await getMarketNewsFallback(query, limit);
  }
}

// Fallback method using APIs (if agent fails)
async function getMarketNewsFallback(
  query: string,
  limit: number = 20
): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];

  try {
    // Try API sources as fallback
    const primarySources = [
      () => getNewsDataIO(query, limit),
      () => getAlphaVantageNews(query, limit),
    ];

    const results = await Promise.allSettled(
      primarySources.map(source => source())
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    // Filter for trusted sources
    const trustedArticles = allArticles.filter(article => 
      isTrustedSource(article.source, article.url)
    );

    return trustedArticles.slice(0, limit);
  } catch (error) {
    console.error('Error fetching news fallback:', error);
    return [];
  }
}

// Simple sentiment analysis - only positive or negative (no neutral)
function analyzeArticleSentiment(article: NewsArticle): 'positive' | 'negative' {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  const positiveKeywords = ['up', 'gain', 'rise', 'surge', 'growth', 'beat', 'positive', 'bullish', 'upgrade', 'profit', 'success', 'rally', 'soar', 'breakthrough', 'record high', 'all-time high', 'outperform'];
  const negativeKeywords = ['down', 'fall', 'drop', 'decline', 'loss', 'miss', 'negative', 'bearish', 'downgrade', 'fail', 'crisis', 'crash', 'plunge', 'collapse', 'disaster'];
  
  const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;
  const negativeCount = negativeKeywords.filter(keyword => text.includes(keyword)).length;
  
  // Force a decision: if equal or no clear signal, default to positive (slight bias)
  if (positiveCount >= negativeCount) return 'positive';
  return 'negative';
}

// Helper function to retry with exponential backoff for rate limits
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429 || error.status === 429;
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not rate limit or last attempt, return null
      if (!isRateLimit) {
        throw error;
      }
      return null;
    }
  }
  return null;
}

// Free Google News RSS feed (no API key required)
async function getGoogleNewsRSS(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    // Enhanced query focusing on financial/price-moving news
    const enhancedQuery = `${query} (earnings OR quarterly OR partnership OR integration OR announcement OR regulatory OR analyst OR price target)`;
    const encodedQuery = encodeURIComponent(enhancedQuery);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
    
    const result = await retryWithBackoff(async () => {
      const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, {
        timeout: 15000,
      });
      return response;
    });

    if (!result || !result.data?.items) {
      return [];
    }

    return result.data.items
      .map((item: any) => ({
        title: item.title?.replace(/<[^>]*>/g, '') || '',
        description: item.contentSnippet || item.description || '',
        url: item.link || '#',
        publishedAt: item.pubDate || new Date().toISOString(),
        source: item.source || extractDomain(item.link || '') || 'Google News',
      }))
      .filter((article: NewsArticle) => isTrustedSource(article.source, article.url)) // Filter trusted sources
      .slice(0, limit);
  } catch (error) {
    // Silently handle rate limits - we'll use other sources
    if (axios.isAxiosError(error) && error.response?.status !== 429) {
      console.error('Error fetching Google News:', error.message);
    }
    return [];
  }
}

// Enhanced Google News search with multiple queries
async function getGoogleNewsRSSEnhanced(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    const queries = [
      `${query} earnings quarterly results`,
      `${query} partnership integration deal`,
      `${query} analyst upgrade downgrade price target`,
      `${query} announcement launch regulatory`,
    ];

    const allResults: NewsArticle[] = [];

    // Sequential requests with delays to avoid rate limits
    for (let i = 0; i < queries.length; i++) {
      const searchQuery = queries[i];
      
      // Add delay between requests (except first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
        
        const result = await retryWithBackoff(async () => {
          const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, {
            timeout: 10000,
          });
          return response;
        }, 2, 2000); // 2 retries, 2 second initial delay

        if (result && result.data?.items) {
          const articles = result.data.items
            .map((item: any) => ({
              title: item.title?.replace(/<[^>]*>/g, '') || '',
              description: item.contentSnippet || item.description || '',
              url: item.link || '#',
              publishedAt: item.pubDate || new Date().toISOString(),
              source: item.source || extractDomain(item.link || '') || 'Google News',
            }))
            .filter((article: NewsArticle) => isTrustedSource(article.source, article.url)); // Filter trusted sources
          allResults.push(...articles);
        }
      } catch (error) {
        // Continue with other queries if one fails (rate limit or other error)
        continue;
      }
    }

    return allResults;
  } catch (error) {
    // Silently handle errors - we'll use other sources
    return [];
  }
}

// NewsData.io free tier (no API key for limited requests)
async function getNewsDataIO(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    // NewsData.io has a free tier with limited requests
    // You can get a free API key at https://newsdata.io/
    const NEWS_DATA_API_KEY = process.env.NEXT_PUBLIC_NEWS_DATA_API_KEY || '';
    
    if (NEWS_DATA_API_KEY) {
      // Enhanced query for financial news
      const enhancedQuery = `${query} (earnings OR financial OR partnership OR analyst)`;
      
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: NEWS_DATA_API_KEY,
          q: enhancedQuery,
          language: 'en',
          category: 'business,finance',
          size: limit,
        },
        timeout: 10000,
      });

      if (response.data?.results) {
        return response.data.results
          .map((article: any) => ({
            title: article.title || '',
            description: article.description || '',
            url: article.link || '#',
            publishedAt: article.pubDate || new Date().toISOString(),
            source: article.source_id || extractDomain(article.link || '') || 'NewsData',
          }))
          .filter((article: NewsArticle) => isTrustedSource(article.source, article.url)); // Filter trusted sources
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching NewsData.io:', error);
    return [];
  }
}

// Alpha Vantage News & Sentiment (free tier available)
async function getAlphaVantageNews(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
    
    // Use Alpha Vantage News & Sentiment API
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'NEWS_SENTIMENT',
        tickers: query.toUpperCase(),
        apikey: ALPHA_VANTAGE_KEY,
        limit: Math.min(limit, 50),
      },
      timeout: 10000,
    });

    if (response.data?.feed) {
      return response.data.feed
        .map((article: any) => ({
          title: article.title || '',
          description: article.summary || '',
          url: article.url || '#',
          publishedAt: article.time_published || new Date().toISOString(),
          source: article.source || extractDomain(article.url || '') || 'Alpha Vantage',
          sentiment: article.overall_sentiment_label?.toLowerCase() || 'neutral',
        }))
        .filter((article: NewsArticle) => isTrustedSource(article.source, article.url)) // Filter trusted sources
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error('Error fetching Alpha Vantage News:', error);
    return [];
  }
}

// Remove duplicate articles based on title similarity
function removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  for (const article of articles) {
    // Normalize title for comparison
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // Check if we've seen a similar title (allowing for small variations)
    let isDuplicate = false;
    for (const seenTitle of seen) {
      if (normalizedTitle === seenTitle || 
          normalizedTitle.includes(seenTitle.substring(0, 20)) ||
          seenTitle.includes(normalizedTitle.substring(0, 20))) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate && article.title) {
      seen.add(normalizedTitle);
      unique.push(article);
    }
  }

  return unique;
}

// Analyze sentiment of news articles using enhanced keyword analysis
export function analyzeNewsSentiment(articles: NewsArticle[]): {
  positive: number;
  negative: number;
  neutral: number;
  overall: 'positive' | 'negative';
} {
  if (articles.length === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      overall: 'positive', // Default to positive if no articles
    };
  }

  // Enhanced keyword lists for better sentiment analysis
  // These keywords are weighted - the more keywords found, the stronger the sentiment
  const positiveKeywords = [
    // Strong positive indicators
    'surge', 'soar', 'rally', 'rocket', 'breakthrough', 'record high', 'all-time high',
    'outperform', 'beat expectations', 'exceed', 'surpass',
    // Moderate positive indicators
    'growth', 'profit', 'gain', 'increase', 'rise', 'climb', 'boost', 'strong',
    'bullish', 'positive', 'success', 'momentum', 'expansion',
    // Mild positive indicators
    'up', 'optimistic', 'upgrade', 'buy', 'buying', 'recommend', 'target price'
  ];
  
  const negativeKeywords = [
    // Strong negative indicators
    'crash', 'plunge', 'collapse', 'crisis', 'worst', 'disaster', 'bankruptcy',
    'miss expectations', 'disappoint', 'warning', 'downgrade',
    // Moderate negative indicators
    'loss', 'decline', 'drop', 'fall', 'dip', 'slump', 'downturn', 'bearish',
    'weak', 'negative', 'concern', 'worry', 'risk',
    // Mild negative indicators
    'down', 'sell', 'selling', 'caution', 'volatile'
  ];

  let positive = 0;
  let negative = 0;

  articles.forEach(article => {
    // If article already has sentiment from API (e.g., Alpha Vantage), use it
    // But convert neutral to positive/negative
    if (article.sentiment) {
      if (article.sentiment === 'positive') {
        positive++;
      } else if (article.sentiment === 'negative') {
        negative++;
      } else {
        // Convert neutral to positive (slight bias)
        positive++;
      }
      return;
    }

    // Otherwise, analyze using keywords
    const text = `${article.title} ${article.description}`.toLowerCase();
    const posCount = positiveKeywords.filter(kw => text.includes(kw)).length;
    const negCount = negativeKeywords.filter(kw => text.includes(kw)).length;

    // Weight the sentiment based on keyword frequency
    // More keywords = stronger sentiment
    const sentimentScore = posCount - negCount;
    
    // Force positive or negative - no neutral
    if (sentimentScore >= 0) {
      // Positive sentiment (including ties - slight positive bias)
      positive++;
    } else {
      // Negative sentiment
      negative++;
    }
  });

  const total = articles.length || 1;
  const positivePercent = (positive / total) * 100;
  const negativePercent = (negative / total) * 100;
  
  // Determine overall sentiment - only positive or negative
  const sentimentDiff = positivePercent - negativePercent;
  const overall: 'positive' | 'negative' = sentimentDiff >= 0 ? 'positive' : 'negative';

  return {
    positive: Math.round(positivePercent * 10) / 10, // Round to 1 decimal
    negative: Math.round(negativePercent * 10) / 10,
    neutral: 0, // No neutral
    overall,
  };
}

