import { NextResponse } from 'next/server';
import axios from 'axios';

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  author: string;
}

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

// Sentiment analysis keywords (same as news sentiment)
const positiveKeywords = [
  'surge', 'soar', 'rally', 'rocket', 'breakthrough', 'record high', 'all-time high',
  'outperform', 'beat', 'exceed', 'surpass', 'growth', 'profit', 'gain', 'increase',
  'rise', 'climb', 'boost', 'strong', 'bullish', 'positive', 'success', 'momentum',
  'up', 'optimistic', 'upgrade', 'buy', 'buying', 'recommend', 'moon', 'pump',
  'hodl', 'diamond hands', 'to the moon'
];

const negativeKeywords = [
  'crash', 'plunge', 'collapse', 'crisis', 'worst', 'disaster', 'bankruptcy',
  'miss', 'disappoint', 'warning', 'downgrade', 'loss', 'decline', 'drop',
  'fall', 'dip', 'slump', 'downturn', 'bearish', 'weak', 'negative', 'concern',
  'worry', 'risk', 'down', 'sell', 'selling', 'caution', 'volatile', 'dump',
  'paper hands', 'rug pull', 'scam'
];

function analyzeSentiment(text: string): 'positive' | 'negative' {
  const lowerText = text.toLowerCase();
  const posCount = positiveKeywords.filter(kw => lowerText.includes(kw)).length;
  const negCount = negativeKeywords.filter(kw => lowerText.includes(kw)).length;
  
  // Also check for emoji sentiment
  const positiveEmojis = (lowerText.match(/🚀|📈|💎|🦍|✅|👍|💪|🔥|⭐/g) || []).length;
  const negativeEmojis = (lowerText.match(/📉|💸|❌|👎|😱|⚠️|🔻/g) || []).length;
  
  const totalPositive = posCount + positiveEmojis;
  const totalNegative = negCount + negativeEmojis;
  
  return totalPositive >= totalNegative ? 'positive' : 'negative';
}

async function fetchRedditPosts(query: string, limit: number = 20): Promise<SocialPost[]> {
  try {
    // Reddit search API (free, no API key needed)
    const searchUrl = `https://www.reddit.com/search.json`;
    
    const response = await axios.get(searchUrl, {
      params: {
        q: query,
        sort: 'hot',
        limit: Math.min(limit, 25), // Reddit API limit
        type: 'link',
      },
      headers: {
        'User-Agent': 'NextLevelTrading/1.0',
      },
      timeout: 10000,
    });

    if (!response.data?.data?.children) {
      return [];
    }

    const posts: SocialPost[] = response.data.data.children
      .map((child: any) => {
        const post: RedditPost = child.data;
        const text = `${post.title} ${post.selftext || ''}`;
        
        return {
          title: post.title,
          content: post.selftext || post.title,
          score: post.score || 0,
          comments: post.num_comments || 0,
          timestamp: post.created_utc * 1000,
          source: `r/${post.subreddit}`,
          url: `https://www.reddit.com${post.permalink}`,
          author: post.author,
          sentiment: analyzeSentiment(text),
        };
      })
      .filter((post: SocialPost) => post.content.length > 0);

    return posts;
  } catch (error: any) {
    console.error('Error fetching Reddit posts:', error.message);
    return [];
  }
}

async function fetchRedditSubredditPosts(
  subreddit: string,
  query: string,
  limit: number = 10
): Promise<SocialPost[]> {
  try {
    // Search specific subreddits for better results
    const subreddits = [
      'stocks',
      'investing',
      'StockMarket',
      'wallstreetbets',
      'cryptocurrency',
      'CryptoCurrency',
      'Bitcoin',
      'ethereum',
      'CryptoMarkets',
    ];

    const allPosts: SocialPost[] = [];
    
    // Search in relevant subreddits
    for (const sub of subreddits) {
      if (allPosts.length >= limit) break;
      
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json`;
        const response = await axios.get(url, {
          params: {
            q: query,
            sort: 'hot',
            limit: 5,
            restrict_sr: 'true',
          },
          headers: {
            'User-Agent': 'NextLevelTrading/1.0',
          },
          timeout: 8000,
        });

        if (response.data?.data?.children) {
          const posts: SocialPost[] = response.data.data.children
            .map((child: any) => {
              const post: RedditPost = child.data;
              const text = `${post.title} ${post.selftext || ''}`;
              
              return {
                title: post.title,
                content: post.selftext || post.title,
                score: post.score || 0,
                comments: post.num_comments || 0,
                timestamp: post.created_utc * 1000,
                source: `r/${post.subreddit}`,
                url: `https://www.reddit.com${post.permalink}`,
                author: post.author,
                sentiment: analyzeSentiment(text),
              };
            })
            .filter((post: SocialPost) => post.content.length > 0);
          
          allPosts.push(...posts);
        }
      } catch (error) {
        // Continue with other subreddits if one fails
        continue;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allPosts.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching subreddit posts:', error.message);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'all'; // 'crypto' | 'stock' | 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Build search query based on type
    let searchQuery = query;
    if (type === 'stock') {
      // For stocks, search for symbol and company name
      searchQuery = `${query} stock OR ${query} investing`;
    } else if (type === 'crypto') {
      // For crypto, search for coin name and symbol
      searchQuery = `${query} crypto OR ${query} cryptocurrency`;
    }

    // Fetch posts from Reddit
    const [generalPosts, subredditPosts] = await Promise.all([
      fetchRedditPosts(searchQuery, Math.floor(limit / 2)),
      fetchRedditSubredditPosts('', searchQuery, Math.floor(limit / 2)),
    ]);

    // Combine and deduplicate posts
    const allPosts = [...generalPosts, ...subredditPosts];
    const uniquePosts = allPosts.filter((post, index, self) =>
      index === self.findIndex((p) => p.url === post.url)
    );

    // Sort by score (engagement)
    uniquePosts.sort((a, b) => b.score - a.score);

    // Calculate overall sentiment
    const totalPosts = uniquePosts.length;
    const positivePosts = uniquePosts.filter(p => p.sentiment === 'positive').length;
    const negativePosts = uniquePosts.filter(p => p.sentiment === 'negative').length;
    
    const positivePercent = totalPosts > 0 ? (positivePosts / totalPosts) * 100 : 0;
    const negativePercent = totalPosts > 0 ? (negativePosts / totalPosts) * 100 : 0;
    
    const overall = positivePercent >= negativePercent ? 'positive' : 'negative';

    return NextResponse.json({
      posts: uniquePosts.slice(0, limit),
      sentiment: {
        overall,
        positive: Math.round(positivePercent * 10) / 10,
        negative: Math.round(negativePercent * 10) / 10,
        total: totalPosts,
      },
    });
  } catch (error: any) {
    console.error('Error in sentiment API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social sentiment' },
      { status: 500 }
    );
  }
}

