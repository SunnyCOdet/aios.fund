import axios from 'axios';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Fetch news from multiple free sources
export async function getMarketNews(
  query: string,
  limit: number = 20
): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];

  try {
    // Try multiple free news sources
    const sources = [
      () => getGoogleNewsRSS(query, limit),
      () => getNewsDataIO(query, limit),
      () => getAlphaVantageNews(query, limit),
    ];

    // Fetch from all sources in parallel
    const results = await Promise.allSettled(
      sources.map(source => source())
    );

    // Combine all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    // Remove duplicates based on title similarity
    const uniqueArticles = removeDuplicates(allArticles);

    // Sort by date (newest first) and limit
    return uniqueArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Free Google News RSS feed (no API key required)
async function getGoogleNewsRSS(query: string, limit: number): Promise<NewsArticle[]> {
  try {
    // Use Google News RSS feed
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}+financial+market&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, {
      timeout: 15000,
    });

    if (response.data?.items) {
      return response.data.items.slice(0, limit).map((item: any) => ({
        title: item.title?.replace(/<[^>]*>/g, '') || '',
        description: item.contentSnippet || item.description || '',
        url: item.link || '#',
        publishedAt: item.pubDate || new Date().toISOString(),
        source: item.source || 'Google News',
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Google News:', error);
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
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: NEWS_DATA_API_KEY,
          q: query,
          language: 'en',
          category: 'business,finance',
          size: limit,
        },
        timeout: 10000,
      });

      if (response.data?.results) {
        return response.data.results.map((article: any) => ({
          title: article.title || '',
          description: article.description || '',
          url: article.link || '#',
          publishedAt: article.pubDate || new Date().toISOString(),
          source: article.source_id || 'NewsData',
        }));
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
      return response.data.feed.slice(0, limit).map((article: any) => ({
        title: article.title || '',
        description: article.summary || '',
        url: article.url || '#',
        publishedAt: article.time_published || new Date().toISOString(),
        source: article.source || 'Alpha Vantage',
        sentiment: article.overall_sentiment_label?.toLowerCase() || 'neutral',
      }));
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
  overall: 'positive' | 'negative' | 'neutral';
} {
  if (articles.length === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 100,
      overall: 'neutral',
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
  let neutral = 0;

  articles.forEach(article => {
    // If article already has sentiment from API (e.g., Alpha Vantage), use it
    if (article.sentiment) {
      if (article.sentiment === 'positive') positive++;
      else if (article.sentiment === 'negative') negative++;
      else neutral++;
      return;
    }

    // Otherwise, analyze using keywords
    const text = `${article.title} ${article.description}`.toLowerCase();
    const posCount = positiveKeywords.filter(kw => text.includes(kw)).length;
    const negCount = negativeKeywords.filter(kw => text.includes(kw)).length;

    // Weight the sentiment based on keyword frequency
    // More keywords = stronger sentiment
    const sentimentScore = posCount - negCount;
    
    // Improved threshold logic:
    // - If clear positive signal (score > 0 and has positive keywords)
    // - If clear negative signal (score < 0 and has negative keywords)
    // - Otherwise neutral (balanced or no keywords)
    if (sentimentScore > 0 && posCount > 0) {
      // Positive sentiment
      positive++;
    } else if (sentimentScore < 0 && negCount > 0) {
      // Negative sentiment
      negative++;
    } else {
      // Neutral (balanced keywords, no keywords, or equal counts)
      neutral++;
    }
  });

  const total = articles.length || 1;
  const positivePercent = (positive / total) * 100;
  const negativePercent = (negative / total) * 100;
  const neutralPercent = (neutral / total) * 100;
  
  // Determine overall sentiment
  // Consider it positive if positive > negative by at least 10%
  // Consider it negative if negative > positive by at least 10%
  // Otherwise neutral
  const sentimentDiff = positivePercent - negativePercent;
  let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
  
  if (sentimentDiff > 10) {
    overall = 'positive';
  } else if (sentimentDiff < -10) {
    overall = 'negative';
  } else {
    overall = 'neutral';
  }

  return {
    positive: Math.round(positivePercent * 10) / 10, // Round to 1 decimal
    negative: Math.round(negativePercent * 10) / 10,
    neutral: Math.round(neutralPercent * 10) / 10,
    overall,
  };
}

