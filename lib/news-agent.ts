import puppeteer, { Browser, Page } from 'puppeteer';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  fullContent?: string;
}

// Trusted news domains - only news from these domains will be shown
const TRUSTED_DOMAINS = [
  // Major Financial News
  'bloomberg.com', 'reuters.com',  'wsj.com', 'cnbc.com',
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

// Check if source is trusted
function isTrustedSource(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;
  
  // Check blacklist first
  if (UNTRUSTED_DOMAINS.some(untrusted => domain.includes(untrusted))) {
    return false;
  }
  
  // Check trusted domains
  return TRUSTED_DOMAINS.some(trusted => domain.includes(trusted));
}

// Singleton browser instance
let browserInstance: Browser | null = null;

// Get or create browser instance
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });
  }
  return browserInstance;
}

// Close browser instance
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Keywords that indicate navigation/category links (not actual articles)
const NAVIGATION_KEYWORDS = [
  'newsletter', 'newsletters', 'more news', 'today\'s news', 'tech news',
  'politics', 'world', 'weather', 'health', 'science', 'sports', 'entertainment',
  'workspace', 'data catalogue', 'world-check', 'opens new tab',
  'subscribe', 'sign up', 'login', 'register', 'about', 'contact', 'privacy',
  'terms', 'cookie', 'advertise', 'careers', 'help', 'support', 'faq',
  'home', 'menu', 'navigation', 'search', 'archive', 'categories',
  'stock movers', 'market movers', 'top stories', 'trending', 'popular',
  'latest', 'breaking', 'headlines', 'section', 'category', 'tag',
];

// Price-moving keywords that indicate significant news for quant analysis
const PRICE_MOVING_KEYWORDS = [
  // Earnings & Financial Reports
  'earnings', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'revenue', 'profit', 'loss', 'guidance',
  'forecast', 'beat', 'miss', 'eps', 'financial results', 'annual report', 'quarterly report',
  
  // Partnerships & Integrations
  'partnership', 'integration', 'collaboration', 'alliance', 'deal', 'merger', 'acquisition',
  'partners with', 'teams up', 'joins forces', 'buys', 'acquires', 'takeover',
  
  // Product Launches & Updates
  'launch', 'release', 'introduces', 'unveils', 'announces', 'rolls out', 'debuts',
  'product launch', 'new product',
  
  // Regulatory & Legal
  'sec', 'regulation', 'regulatory', 'approval', 'lawsuit', 'legal', 'investigation',
  'fine', 'settlement', 'compliance', 'fda approval', 'regulatory approval',
  
  // Market Events
  'ipo', 'listing', 'delisting', 'stock split', 'dividend', 'buyback', 'share',
  'trading halt', 'circuit breaker', 'stock buyback', 'share buyback',
  
  // Major Announcements
  'ceo', 'executive', 'leadership', 'restructuring', 'layoffs', 'expansion',
  'closes', 'opens', 'factory', 'facility', 'plant', 'manufacturing',
  
  // Crypto-Specific
  'adoption', 'institutional', 'etf', 'halving', 'fork', 'upgrade', 'hard fork',
  'mainnet', 'testnet', 'staking', 'burn', 'tokenomics', 'token burn',
  
  // Technology & Development
  'protocol', 'upgrade', 'update', 'patch', 'vulnerability', 'security', 'hack',
  'blockchain upgrade', 'network upgrade',
  
  // Market Analysis & Analyst Actions
  'price target', 'analyst', 'upgrade', 'downgrade', 'rating', 'outlook', 'bullish', 'bearish',
  'analyst upgrade', 'analyst downgrade', 'price target raised', 'price target lowered',
  'initiates coverage', 'maintains', 'reiterates',
  
  // Financial Metrics
  'revenue growth', 'profit margin', 'ebitda', 'free cash flow', 'guidance raised',
  'guidance lowered', 'guidance cut', 'outlook', 'forecast',
];

// Irrelevant keywords that indicate non-price-moving news
const IRRELEVANT_KEYWORDS = [
  'celebrity', 'gossip', 'rumor', 'unconfirmed', 'speculation',
  'memecoin', 'shiba', 'dogecoin', 'joke', 'prank',
  'social media', 'tweet', 'reddit', 'forum', 'discord',
  'price prediction', 'will hit', 'going to', 'might reach', 'could reach',
  'general news', 'science news', 'health news', 'weather', 'politics',
];

// Check if title looks like a navigation link or category
function isNavigationLink(title: string, url: string): boolean {
  const titleLower = title.toLowerCase().trim();
  const urlLower = url.toLowerCase();
  
  // Check for navigation keywords
  if (NAVIGATION_KEYWORDS.some(keyword => titleLower === keyword || titleLower.includes(keyword + ' '))) {
    return true;
  }
  
  // Check for very short titles (likely navigation)
  if (titleLower.length < 15 && !titleLower.includes(' ') && !urlLower.includes('/article') && !urlLower.includes('/news')) {
    return true;
  }
  
  // Check for generic patterns
  if (titleLower.match(/^(the|a|an)\s+\d+$/)) return true; // "The 360"
  if (titleLower === 'more news' || titleLower === 'news') return true;
  if (urlLower.includes('/category/') || urlLower.includes('/tag/') || urlLower.includes('/section/')) return true;
  if (urlLower.includes('/newsletter') || urlLower.includes('/subscribe')) return true;
  
  return false;
}

// Check if article is price-moving news (quant-focused)
function isPriceMovingNews(article: NewsArticle): boolean {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Check for irrelevant keywords first
  const hasIrrelevant = IRRELEVANT_KEYWORDS.some(keyword => text.includes(keyword));
  if (hasIrrelevant) return false;
  
  // Check for price-moving keywords
  const hasPriceMoving = PRICE_MOVING_KEYWORDS.some(keyword => text.includes(keyword));
  
  // Also check for financial numbers (earnings, revenue, etc.)
  const hasFinancialNumbers = /\$[\d,]+(?:million|billion|trillion|m|b|t)?/i.test(text) ||
                              /\d+%/.test(text) ||
                              /(?:revenue|profit|loss|earnings).*[\d,]+/i.test(text) ||
                              /\d+\.\d+%/.test(text); // Percentage changes
  
  return hasPriceMoving || hasFinancialNumbers;
}

// Fast extraction helper - optimized for speed with quant-focused filtering
function createFastExtractor(selectors: string[], urlPattern?: string) {
  return async (page: Page) => {
    return await page.evaluate((selectors: string[], navKeywords: string[], urlPattern?: string) => {
      const articles: any[] = [];
      const seen = new Set<string>();
      
      for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        for (let i = 0; i < Math.min(items.length, 50); i++) {
          const item = items[i] as HTMLElement;
          try {
            let href = item.getAttribute('href') || '';
            if (!href || seen.has(href)) continue;
            
            // Skip navigation/category links
            if (href.includes('/category/') || href.includes('/tag/') || 
                href.includes('/section/') || href.includes('/newsletter') ||
                href.includes('/subscribe') || href.includes('/archive')) {
              continue;
            }
            
            // Normalize relative URLs
            if (href.startsWith('./')) {
              href = href.substring(1);
            }
            
            // Check URL pattern if provided
            if (urlPattern && !href.includes(urlPattern)) continue;
            
            // Skip if URL looks like navigation
            if (!href.includes('/article') && !href.includes('/news/') && 
                !href.includes('/story/') && !href.includes('/202') && 
                !href.match(/\d{4}\/\d{2}\//)) {
              // Might be navigation, check title
            }
            
            seen.add(href);
            const title = item.textContent?.trim() || '';
            
            // Skip if title is too short or looks like navigation
            if (title.length < 15) continue;
            if (navKeywords.some(kw => title.toLowerCase() === kw || title.toLowerCase().startsWith(kw + ' '))) continue;
            if (title.match(/^(the|a|an)\s+\d+$/i)) continue; // "The 360"
            
            // Must look like an actual article title (has multiple words, not just a category)
            const wordCount = title.split(/\s+/).length;
            if (wordCount < 3) continue; // Too short to be an article
            
            articles.push({
              title: title.substring(0, 200),
              description: '',
              url: href,
              publishedAt: new Date().toISOString(),
            });
            
            if (articles.length >= 15) break;
          } catch (e) {
            // Continue on error
          }
        }
        if (articles.length >= 15) break;
      }
      
      return articles.slice(0, 15);
    }, selectors, NAVIGATION_KEYWORDS, urlPattern);
  };
}

// Search individual news websites directly
async function searchNewsWebsite(
  page: Page,
  site: { name: string; domain: string; searchUrl: (query: string) => string; extractor: (page: Page) => Promise<NewsArticle[]> },
  query: string
): Promise<NewsArticle[]> {
  try {
    const searchUrl = site.searchUrl(query);
    console.log(`[News Agent] Searching ${site.name}: ${query}`);
    
    // Use faster wait strategy
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000
    }).catch(() => {
      // Continue even if navigation has issues
    });
    
    // Wait for dynamic content (reduced time)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract with timeout
    const articles = await Promise.race([
      site.extractor(page),
      new Promise<NewsArticle[]>((resolve) => {
        setTimeout(() => resolve([]), 20000); // 20 second timeout
      })
    ]);
    
    // Ensure all articles have the correct source and valid URLs
    // Filter out navigation links and categories
    return articles
      .map(article => {
        let url = article.url;
        
        // Normalize URL
        if (!url.startsWith('http')) {
          if (url.startsWith('/')) {
            url = `https://${site.domain}${url}`;
          } else if (url.startsWith('./')) {
            url = `https://${site.domain}${url.substring(1)}`;
          } else {
            url = `https://${site.domain}/${url}`;
          }
        }
        
        return {
          ...article,
          source: site.name,
          url: url,
        };
      })
      .filter(article => {
        // Filter out invalid URLs
        if (!article.url || !article.url.startsWith('http')) return false;
        
        // Filter out navigation links and categories
        if (isNavigationLink(article.title, article.url)) return false;
        
        // Must have a proper article title (at least 3 words, not just a category)
        const wordCount = article.title.split(/\s+/).length;
        if (wordCount < 3) return false;
        
        // Skip if URL is clearly a category/navigation page
        const urlLower = article.url.toLowerCase();
        if (urlLower.includes('/category/') || urlLower.includes('/tag/') || 
            urlLower.includes('/section/') || urlLower.includes('/newsletter') ||
            urlLower.includes('/subscribe') || urlLower.includes('/archive') ||
            urlLower.includes('/workspace') || urlLower.includes('/catalogue')) {
          return false;
        }
        
        return true;
      });
  } catch (error: any) {
    if (error.name !== 'TimeoutError') {
      console.warn(`[News Agent] ${site.name}: ${error.message || error}`);
    }
    return [];
  }
}

// Define search strategies for different news websites - EXPANDED with more sources
const newsSites = [
  {
    name: 'Bloomberg',
    domain: 'bloomberg.com',
    searchUrl: (query: string) => `https://www.bloomberg.com/search?query=${encodeURIComponent(query)}`,
    extractor: async (page: Page) => {
      return await page.evaluate(() => {
        const articles: any[] = [];
        const seen = new Set<string>();
        
        // Simplified selectors for Bloomberg - faster extraction
        const selectors = ['article a', 'h3 a', 'h2 a', 'a[href*="/news/"]'];
        
        for (const selector of selectors) {
          const items = document.querySelectorAll(selector);
          for (let i = 0; i < Math.min(items.length, 30); i++) {
            const item = items[i];
            try {
              const href = (item as HTMLElement).getAttribute('href') || '';
              if (!href || seen.has(href)) continue;
              seen.add(href);
              
              const title = item.textContent?.trim() || '';
              if (!title || title.length < 10) continue;
              
              articles.push({
                title: title.substring(0, 200),
                description: '',
                url: href.startsWith('http') ? href : `https://www.bloomberg.com${href}`,
                publishedAt: new Date().toISOString(),
              });
              
              if (articles.length >= 15) break;
            } catch (e) {}
          }
          if (articles.length >= 15) break;
        }
        
        return articles.slice(0, 15);
      });
    },
  },
  {
    name: 'Reuters',
    domain: 'reuters.com',
    searchUrl: (query: string) => `https://www.reuters.com/search/news?blob=${encodeURIComponent(query)}`,
    extractor: async (page: Page) => {
      return await page.evaluate(() => {
        const articles: any[] = [];
        const seen = new Set<string>();
        
        // Simplified selectors for Reuters
        const items = document.querySelectorAll('article a, h3 a, a[href*="/article/"]');
        
        for (let i = 0; i < Math.min(items.length, 30); i++) {
          const item = items[i];
          try {
            const href = (item as HTMLElement).getAttribute('href') || '';
            if (!href || seen.has(href) || !href.includes('/')) continue;
            seen.add(href);
            
            const title = item.textContent?.trim() || '';
            if (!title || title.length < 10) continue;
            
            articles.push({
              title: title.substring(0, 200),
              description: '',
              url: href.startsWith('http') ? href : `https://www.reuters.com${href}`,
              publishedAt: new Date().toISOString(),
            });
            
            if (articles.length >= 15) break;
          } catch (e) {}
        }
        
        return articles.slice(0, 15);
      });
    },
  },
  {
    name: 'CNBC',
    domain: 'cnbc.com',
    searchUrl: (query: string) => `https://www.cnbc.com/search/?query=${encodeURIComponent(query)}&qsearchterm=${encodeURIComponent(query)}`,
    extractor: async (page: Page) => {
      return await page.evaluate(() => {
        const articles: any[] = [];
        const seen = new Set<string>();
        const items = document.querySelectorAll('article a, h3 a, a[href*="/"]');
        
        for (let i = 0; i < Math.min(items.length, 25); i++) {
          const item = items[i];
          try {
            const href = (item as HTMLElement).getAttribute('href') || '';
            if (!href || seen.has(href) || !href.includes('/')) continue;
            seen.add(href);
            
            const title = item.textContent?.trim() || '';
            if (!title || title.length < 10) continue;
            
            articles.push({
              title: title.substring(0, 200),
              description: '',
              url: href.startsWith('http') ? href : `https://www.cnbc.com${href}`,
              publishedAt: new Date().toISOString(),
            });
            
            if (articles.length >= 15) break;
          } catch (e) {}
        }
        
        return articles.slice(0, 15);
      });
    },
  },
  {
    name: 'Financial Times',
    domain: 'ft.com',
    searchUrl: (query: string) => `https://www.ft.com/search?q=${encodeURIComponent(query)}`,
    extractor: createFastExtractor(['article a', 'h3 a', 'a[href*="/content/"]']),
  },
  {
    name: 'MarketWatch',
    domain: 'marketwatch.com',
    searchUrl: (query: string) => `https://www.marketwatch.com/search?q=${encodeURIComponent(query)}&m=Keyword&rpp=50&mp=806&bd=false&rs=false`,
    extractor: createFastExtractor(['article a', 'h3 a', 'a.headline']),
  },
  {
    name: 'Yahoo Finance',
    domain: 'finance.yahoo.com',
    searchUrl: (query: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(query)}/news/`,
    extractor: createFastExtractor(['h3 a', 'article a', 'a[href*="/news/"]'], '/news/'),
  },
  {
    name: 'Wall Street Journal',
    domain: 'wsj.com',
    searchUrl: (query: string) => `https://www.wsj.com/search?query=${encodeURIComponent(query)}&mod=searchresults_viewallresults`,
    extractor: createFastExtractor(['article a', 'h3 a'], '/articles/'),
  },
  {
    name: 'Forbes',
    domain: 'forbes.com',
    searchUrl: (query: string) => `https://www.forbes.com/search/?q=${encodeURIComponent(query)}`,
    extractor: createFastExtractor(['article a', 'h3 a'], '/sites/'),
  },
  {
    name: 'Seeking Alpha',
    domain: 'seekingalpha.com',
    searchUrl: (query: string) => `https://seekingalpha.com/search?q=${encodeURIComponent(query)}`,
    extractor: createFastExtractor(['article a', 'h3 a'], '/article/'),
  },
  {
    name: 'Investing.com',
    domain: 'investing.com',
    searchUrl: (query: string) => `https://www.investing.com/search/?q=${encodeURIComponent(query)}&tab=news`,
    extractor: createFastExtractor(['article a', 'h3 a', '.articleItem a'], '/news/'),
  },
  {
    name: 'Barron\'s',
    domain: 'barrons.com',
    searchUrl: (query: string) => `https://www.barrons.com/search?query=${encodeURIComponent(query)}`,
    extractor: createFastExtractor(['article a', 'h3 a'], '/articles/'),
  },
  {
    name: 'CoinDesk',
    domain: 'coindesk.com',
    searchUrl: (query: string) => `https://www.coindesk.com/search/${encodeURIComponent(query)}/`,
    extractor: createFastExtractor(['article a', 'h3 a']),
  },
  {
    name: 'CoinTelegraph',
    domain: 'cointelegraph.com',
    searchUrl: (query: string) => `https://cointelegraph.com/tags/${encodeURIComponent(query)}`,
    extractor: createFastExtractor(['article a', 'h3 a'], '/news/'),
  },
];

// Generate smart search queries based on asset type
function generateSmartQueries(query: string, assetType?: 'crypto' | 'stock'): string[] {
  // Detect if it's crypto (common crypto names/symbols)
  const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada', 
    'polkadot', 'dot', 'chainlink', 'link', 'uniswap', 'uni', 'litecoin', 'ltc', 'xrp', 'ripple',
    'dogecoin', 'doge', 'shiba', 'shib', 'avalanche', 'avax', 'polygon', 'matic', 'cosmos', 'atom'];
  
  const isCrypto = assetType === 'crypto' || 
    cryptoKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));
  
  if (isCrypto) {
    // Crypto-specific queries
    return [
      query, // Base query first
      `${query} price market crypto`,
      `${query} blockchain upgrade partnership`,
      `${query} adoption integration defi`,
      `${query} token news update`,
    ];
  } else {
    // Stock-specific queries
    return [
      query, // Base query first
      `${query} earnings quarterly financial results`,
      `${query} stock price analyst upgrade downgrade`,
      `${query} partnership integration deal announcement`,
      `${query} revenue profit guidance forecast`,
    ];
  }
}

// News agent that searches individual news websites - PARALLEL for speed
export async function searchNewsAgent(
  query: string,
  limit: number = 50,
  assetType?: 'crypto' | 'stock'
): Promise<NewsArticle[]> {
  const browser = await getBrowser();
  const allArticles: NewsArticle[] = [];

  try {
    // Generate smart queries based on asset type
    const smartQueries = generateSmartQueries(query, assetType);
    
    // Use the first (most relevant) query for parallel searches
    const primaryQuery = smartQueries[0];
    
    // Create pages for parallel searches (faster!)
    // Process all sites in parallel but with better timeout handling
    const searchPromises = newsSites.map(async (site) => {
      const page = await browser.newPage();
      try {
        // Set realistic user agent
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        
        // Set page timeout
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);
        
        const siteArticles = await searchNewsWebsite(page, site, primaryQuery);
        return siteArticles;
      } catch (error: any) {
        if (error.name !== 'TimeoutError') {
          console.error(`[News Agent] Error searching ${site.name}:`, error.message || error);
        }
        return [];
      } finally {
        try {
          await page.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    });

    // Execute all searches in parallel
    // Use Promise.allSettled so one failure doesn't stop others
    const results = await Promise.allSettled(searchPromises);
    
    // Combine all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    // Remove duplicates based on URL and title similarity
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [
        article.url.split('?')[0].split('#')[0], // Remove query params and fragments
        article
      ])).values()
    );

    // Sort by date (newest first)
    uniqueArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    console.log(`[News Agent] Found ${uniqueArticles.length} unique articles from ${newsSites.length} sources`);
    return uniqueArticles.slice(0, limit);
  } catch (error) {
    console.error('[News Agent] Error:', error);
    return allArticles;
  }
}

// Search multiple queries and combine results
export async function getMarketNews(
  query: string,
  limit: number = 20,
  assetType?: 'crypto' | 'stock'
): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];

  try {
    // Generate smart queries based on asset type
    const searchQueries = generateSmartQueries(query, assetType);

    // Only use first query to speed things up (base query only)
    // This reduces total time from 4+ minutes to ~30-60 seconds
    const queriesToUse = searchQueries.slice(0, 1);

    // Search each query sequentially with delays (but use parallel for each query)
    for (let i = 0; i < queriesToUse.length; i++) {
      if (i > 0) {
        // Add small delay between different query batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const results = await searchNewsAgent(queriesToUse[i], Math.ceil(limit * 1.2 / queriesToUse.length), assetType);
      allArticles.push(...results);

      // Stop if we have enough articles
      if (allArticles.length >= limit * 1.5) {
        break;
      }
    }

    console.log(`[News Agent] Before filtering: ${allArticles.length} articles`);
    
    // Quant-focused filtering - prioritize price-moving news
    const validArticles = allArticles.filter(article => {
      // Filter out invalid articles
      if (!article.title || article.title.length < 15) return false;
      if (!article.url || article.url === '#' || !article.url.startsWith('http')) return false;
      
      // Filter out navigation links and categories
      if (isNavigationLink(article.title, article.url)) return false;
      
      // Must have at least 3 words (actual article, not a category)
      const wordCount = article.title.split(/\s+/).length;
      if (wordCount < 3) return false;
      
      // Skip generic category/navigation URLs
      const urlLower = article.url.toLowerCase();
      if (urlLower.includes('/category/') || urlLower.includes('/tag/') || 
          urlLower.includes('/section/') || urlLower.includes('/newsletter') ||
          urlLower.includes('/subscribe') || urlLower.includes('/archive') ||
          urlLower.includes('/workspace') || urlLower.includes('/catalogue') ||
          urlLower.includes('/data-catalogue') || urlLower.includes('/world-check')) {
        return false;
      }
      
      return true;
    });

    // Separate price-moving articles from general articles
    const priceMovingArticles = validArticles.filter(article => isPriceMovingNews(article));
    const generalArticles = validArticles.filter(article => !isPriceMovingNews(article));

    console.log(`[News Agent] Price-moving articles: ${priceMovingArticles.length}, General articles: ${generalArticles.length}`);
    
    // Prioritize price-moving articles, but include all if limit is high enough
    // If limit is very high (>= 500), return all articles, prioritizing price-moving first
    if (limit >= 500) {
      // Return all articles, with price-moving articles first
      const filteredArticles = [
        ...priceMovingArticles,
        ...generalArticles
      ];
      
      console.log(`[News Agent] After quant filtering: ${filteredArticles.length} articles (${priceMovingArticles.length} price-moving)`);
      
      // Remove duplicates based on URL
      const uniqueArticles = Array.from(
        new Map(filteredArticles.map(article => [
          article.url.split('?')[0].split('#')[0],
          article
        ])).values()
      );

      console.log(`[News Agent] After deduplication: ${uniqueArticles.length} articles`);

      // Sort by date (newest first) - no limit applied
      const finalArticles = uniqueArticles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      console.log(`[News Agent] Final articles to return: ${finalArticles.length} (all articles, no limit)`);
      return finalArticles;
    }
    
    // For smaller limits, use 80% price-moving, 20% general
    const targetPriceMoving = Math.min(priceMovingArticles.length, Math.ceil(limit * 0.8));
    const targetGeneral = Math.min(generalArticles.length, limit - targetPriceMoving);
    
    const filteredArticles = [
      ...priceMovingArticles.slice(0, targetPriceMoving),
      ...generalArticles.slice(0, targetGeneral)
    ];

    console.log(`[News Agent] After quant filtering: ${filteredArticles.length} articles (${priceMovingArticles.length} price-moving)`);

    // Remove duplicates based on URL
    const uniqueArticles = Array.from(
      new Map(filteredArticles.map(article => [
        article.url.split('?')[0].split('#')[0], // Remove query params and fragments
        article
      ])).values()
    );

    console.log(`[News Agent] After deduplication: ${uniqueArticles.length} articles`);

    // Sort by date - apply limit only if it's reasonable (< 500)
    const sortedArticles = uniqueArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    const finalArticles = limit >= 500 
      ? sortedArticles // Return all articles if limit is high
      : sortedArticles.slice(0, limit); // Apply limit for smaller requests
    
    console.log(`[News Agent] Final articles to return: ${finalArticles.length}${limit >= 500 ? ' (all articles)' : ''}`);
    return finalArticles;
  } catch (error) {
    console.error('[News Agent] Error in getMarketNews:', error);
    return [];
  }
}

