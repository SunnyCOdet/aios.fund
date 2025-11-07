import axios from 'axios';
import { fetchFromExchange } from './exchange-apis';

// CoinGecko API (free, no key needed)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Using Yahoo Finance API (free, no key required) as primary
// Falls back to Alpha Vantage if needed
const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
// Use environment variable if available, otherwise try demo key
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  marketCap?: number; // Market capitalization in local currency
  currency?: string; // Currency code (USD, INR, GBP, EUR, etc.)
}

export interface HistoricalData {
  date: string;
  price: number;
  volume: number;
}

// Fetch top cryptocurrencies
export async function getTopCryptos(limit: number = 20): Promise<CryptoData[]> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`,
      {
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      }
    );
    
    // Check if response is valid
    if (response.status === 429) {
      console.error('CoinGecko API rate limit exceeded');
      throw new Error('API rate limit exceeded. Please try again in a moment.');
    }
    
    if (response.status !== 200 || !response.data) {
      console.error('Invalid response from CoinGecko API:', response.status);
      throw new Error('Failed to fetch cryptocurrency data from API');
    }
    
    // Check if data is an array
    if (!Array.isArray(response.data)) {
      console.error('Invalid data format from CoinGecko API');
      throw new Error('Invalid data format received from API');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching crypto data:', error);
    
    // Re-throw with a more descriptive error message
    if (error.response) {
      // API returned an error response
      if (error.response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      throw new Error(`API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from API. Please check your internet connection.');
    } else {
      // Error setting up the request
      throw new Error(error.message || 'Failed to fetch cryptocurrency data');
    }
  }
}

// Fetch crypto by ID
export async function getCryptoById(id: string): Promise<CryptoData | null> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${id}&sparkline=true`
    );
    return response.data[0] || null;
  } catch (error) {
    console.error('Error fetching crypto:', error);
    return null;
  }
}

// Fetch crypto historical data
export async function getCryptoHistory(
  id: string,
  days: number = 30
): Promise<HistoricalData[]> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );
    const prices = response.data.prices;
    return prices.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString(),
      price,
      volume: 0,
    }));
  } catch (error) {
    console.error('Error fetching crypto history:', error);
    return [];
  }
}

/**
 * Common exchange suffixes for international stocks
 * Yahoo Finance uses these suffixes to identify exchanges
 */
const EXCHANGE_SUFFIXES: { [key: string]: string[] } = {
  // India
  'NSE': ['.NS'], // National Stock Exchange
  'BSE': ['.BO'], // Bombay Stock Exchange
  // UK
  'LSE': ['.L'], // London Stock Exchange
  // Japan
  'TSE': ['.T'], // Tokyo Stock Exchange
  // Canada
  'TSX': ['.TO'], // Toronto Stock Exchange
  'TSXV': ['.V'], // TSX Venture Exchange
  // Australia
  'ASX': ['.AX'], // Australian Securities Exchange
  // Germany
  'XETR': ['.DE'], // XETRA
  // France
  'EPA': ['.PA'], // Euronext Paris
  // Netherlands
  'AMS': ['.AS'], // Euronext Amsterdam
  // Switzerland
  'SWX': ['.SW'], // SIX Swiss Exchange
  // Hong Kong
  'HKG': ['.HK'], // Hong Kong Stock Exchange
  // China
  'SSE': ['.SS'], // Shanghai Stock Exchange
  'SZSE': ['.SZ'], // Shenzhen Stock Exchange
  // Brazil
  'BVMF': ['.SA'], // B3 (Brazil Stock Exchange)
  // South Korea
  'KRX': ['.KS'], // Korea Exchange
  // Mexico
  'BMV': ['.MX'], // Mexican Stock Exchange
};

/**
 * Map exchange suffixes to currency codes (fallback only - API should provide this)
 * Only used when Yahoo Finance API doesn't return currency information
 */
const EXCHANGE_TO_CURRENCY: { [key: string]: string } = {
  '.NS': 'INR', // India NSE
  '.BO': 'INR', // India BSE
  '.L': 'GBP', // UK LSE
  '.T': 'JPY', // Japan TSE
  '.TO': 'CAD', // Canada TSX
  '.V': 'CAD', // Canada TSXV
  '.AX': 'AUD', // Australia ASX
  '.DE': 'EUR', // Germany XETRA
  '.PA': 'EUR', // France Euronext Paris
  '.AS': 'EUR', // Netherlands Euronext Amsterdam
  '.SW': 'CHF', // Switzerland SIX
  '.HK': 'HKD', // Hong Kong
  '.SS': 'CNY', // China Shanghai
  '.SZ': 'CNY', // China Shenzhen
  '.SA': 'BRL', // Brazil
  '.KS': 'KRW', // South Korea
  '.MX': 'MXN', // Mexico
};

/**
 * Detect currency from symbol exchange suffix (fallback only)
 * This should only be used when the API doesn't provide currency information
 */
function detectCurrencyFromSymbol(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase();
  for (const [suffix, currency] of Object.entries(EXCHANGE_TO_CURRENCY)) {
    if (upperSymbol.endsWith(suffix)) {
      return currency;
    }
  }
  return null; // Return null to indicate we couldn't detect it
}

/**
 * Get exchange suffix suggestions for a symbol
 */
function getExchangeSuffixes(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase();
  const suffixes: string[] = [];
  
  // If symbol already has a suffix, return empty
  if (upperSymbol.includes('.')) {
    return [];
  }
  
  // Return common suffixes to try
  return ['.NS', '.BO', '.L', '.T', '.TO', '.AX', '.DE', '.PA', '.AS', '.SW', '.HK', '.SS', '.SZ', '.SA', '.KS', '.MX'];
}

/**
 * Try fetching stock with different symbol formats
 */
async function tryFetchWithSuffixes(
  baseSymbol: string,
  suffixes: string[]
): Promise<StockData | null> {
  // Try base symbol first
  try {
    const result = await fetchStockFromYahoo(baseSymbol);
    if (result) return result;
  } catch (e) {
    // Continue to try suffixes
  }
  
  // Try with each suffix
  for (const suffix of suffixes) {
    try {
      const symbolWithSuffix = baseSymbol + suffix;
      const result = await fetchStockFromYahoo(symbolWithSuffix);
      if (result) return result;
    } catch (e) {
      // Continue to next suffix
    }
  }
  
  return null;
}

/**
 * Fetch stock data from Yahoo Finance (internal helper)
 */
async function fetchStockFromYahoo(symbol: string): Promise<StockData> {
  const yahooResponse = await axios.get(`${YAHOO_FINANCE_API}/${symbol.toUpperCase()}`, {
    params: {
      interval: '1d',
      range: '1d',
      includePrePost: 'false',
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    timeout: 15000,
    validateStatus: (status) => status < 500,
  });

  if (!yahooResponse.data?.chart?.result?.[0]) {
    if (yahooResponse.data?.chart?.error) {
      throw new Error(yahooResponse.data.chart.error.description || 'Yahoo Finance API error');
    }
    throw new Error('Yahoo Finance API returned no data');
  }

  const result = yahooResponse.data.chart.result[0];
  const meta = result.meta;
  
  if (!meta || !meta.symbol) {
    throw new Error(`Stock symbol "${symbol.toUpperCase()}" not found.`);
  }
  
  const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
  const previousClose = meta.previousClose || currentPrice;
  const change = currentPrice - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  if (currentPrice === 0) {
    throw new Error(`No price data available for "${symbol.toUpperCase()}"`);
  }

  const marketCap = meta.marketCap || 
                   meta.marketMarketCap ||
                   meta.regularMarketMarketCap ||
                   meta.trailingMarketCap ||
                   (meta.sharesOutstanding && currentPrice ? meta.sharesOutstanding * currentPrice : undefined);

  // Get currency directly from Yahoo Finance API response
  // Check multiple possible fields where currency might be stored
  let currency: string | null = null;
  
  // Try to get currency from API response (primary source - this is what we want!)
  if (meta.currency) {
    currency = meta.currency;
  } else if (meta.currencyCode) {
    currency = meta.currencyCode;
  } else if (meta.currencySymbol) {
    // currencySymbol might be like "USD" or "$" - try to normalize it
    const symbol = meta.currencySymbol.toUpperCase();
    currency = symbol.length === 3 ? symbol : null; // Only use if it's a 3-letter code
  } else if (meta.quoteCurrency) {
    currency = meta.quoteCurrency;
  } else if (meta.originalCurrency) {
    currency = meta.originalCurrency;
  }
  
  // Debug: Log available currency fields in development (helps verify API response)
  if (process.env.NODE_ENV === 'development' && !currency) {
    const currencyFields = {
      currency: meta.currency,
      currencyCode: meta.currencyCode,
      currencySymbol: meta.currencySymbol,
      quoteCurrency: meta.quoteCurrency,
      originalCurrency: meta.originalCurrency,
    };
    console.log(`[Currency Debug] Symbol: ${meta.symbol}, Available fields:`, currencyFields);
  }
  
  // Fallback: only use symbol-based detection if API didn't provide currency
  if (!currency) {
    currency = detectCurrencyFromSymbol(meta.symbol);
  }
  
  // Final fallback to USD
  currency = currency || 'USD';

  return {
    symbol: meta.symbol,
    name: meta.longName || meta.shortName || meta.symbol,
    price: currentPrice,
    change: change,
    changePercent: changePercent,
    volume: meta.regularMarketVolume || 0,
    high: meta.regularMarketDayHigh || meta.currentTradingPeriod?.regular?.high || currentPrice,
    low: meta.regularMarketDayLow || meta.currentTradingPeriod?.regular?.low || currentPrice,
    open: meta.regularMarketOpen || meta.currentTradingPeriod?.regular?.open || previousClose,
    marketCap: marketCap,
    currency: currency,
  };
}

// Fetch stock data using Yahoo Finance API (free, no key required)
export async function getStockQuote(symbol: string): Promise<StockData | null> {
  const upperSymbol = symbol.toUpperCase().trim();
  
  // FIRST: Try to fetch directly from the respective stock exchange API
  // This gets data directly from NSE, BSE, LSE, TSE, TSX, ASX, etc.
  if (upperSymbol.includes('.')) {
    try {
      const exchangeData = await fetchFromExchange(upperSymbol);
      if (exchangeData) {
        // Convert ExchangeStockData to StockData format
        return {
          symbol: exchangeData.symbol,
          name: exchangeData.name,
          price: exchangeData.price,
          change: exchangeData.change,
          changePercent: exchangeData.changePercent,
          volume: exchangeData.volume,
          high: exchangeData.high,
          low: exchangeData.low,
          open: exchangeData.open,
          marketCap: exchangeData.marketCap,
          currency: exchangeData.currency,
        };
      }
    } catch (exchangeError) {
      // If exchange API fails, continue to Yahoo Finance fallback
      console.log(`Exchange API failed for ${upperSymbol}, falling back to Yahoo Finance`);
    }
  }
  
  // SECOND: Fall back to Yahoo Finance (works for all exchanges)
  // If symbol already has exchange suffix, try it directly
  if (upperSymbol.includes('.')) {
    try {
      return await fetchStockFromYahoo(upperSymbol);
    } catch (yahooError: any) {
      // Fall through to Alpha Vantage fallback
    }
  } else {
    // Try without suffix first, then with common suffixes
    const suffixes = getExchangeSuffixes(upperSymbol);
    const result = await tryFetchWithSuffixes(upperSymbol, suffixes);
    if (result) return result;
  }

  // If Yahoo Finance fails, try Alpha Vantage as fallback
  try {
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: upperSymbol.split('.')[0], // Remove exchange suffix for Alpha Vantage
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 10000,
    });

    // Check for Alpha Vantage API error messages
    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }
    
    if (response.data['Note']) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    if (response.data['Information']) {
      throw new Error('API call frequency limit exceeded. Get a free key at https://www.alphavantage.co/support/#api-key');
    }

    const quote = response.data['Global Quote'];
    
    if (!quote || !quote['01. symbol']) {
      throw new Error(`Stock symbol "${upperSymbol}" not found. Please check the symbol.`);
    }
    
    if (quote['05. price'] === undefined || quote['05. price'] === '0.0000') {
      throw new Error(`No price data available for "${upperSymbol}"`);
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change'] || '0');
    const changePercentStr = quote['10. change percent'] || '0%';
    const changePercent = parseFloat(changePercentStr.replace('%', ''));

      // Alpha Vantage doesn't provide market cap directly, so we'll leave it undefined
      // The UI will handle showing '--' if market cap is not available
      // Alpha Vantage doesn't provide currency, so detect from symbol as fallback
      const currency = detectCurrencyFromSymbol(upperSymbol) || 'USD';
      
      return {
        symbol: quote['01. symbol'],
        name: quote['01. symbol'],
        price,
        change,
        changePercent,
        volume: parseInt(quote['06. volume'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        open: parseFloat(quote['02. open'] || '0'),
        marketCap: undefined, // Alpha Vantage doesn't provide market cap
        currency: currency,
      };
  } catch (alphaError: any) {
    // If both fail, provide a helpful error message with international stock guidance
    const baseSymbol = upperSymbol.split('.')[0]; // Remove suffix if present
    const hasSuffix = upperSymbol.includes('.');
    
    let errorMsg = `Unable to fetch stock data for "${upperSymbol}".\n\n`;
    
    if (!hasSuffix) {
      errorMsg += `💡 For international stocks, try adding an exchange suffix:\n`;
      errorMsg += `   • India (NSE): ${baseSymbol}.NS (e.g., RELIANCE.NS, TCS.NS)\n`;
      errorMsg += `   • India (BSE): ${baseSymbol}.BO (e.g., RELIANCE.BO)\n`;
      errorMsg += `   • UK (LSE): ${baseSymbol}.L (e.g., VOD.L)\n`;
      errorMsg += `   • Japan (TSE): ${baseSymbol}.T (e.g., 7203.T)\n`;
      errorMsg += `   • Canada (TSX): ${baseSymbol}.TO (e.g., SHOP.TO)\n`;
      errorMsg += `   • Australia (ASX): ${baseSymbol}.AX (e.g., BHP.AX)\n`;
      errorMsg += `   • Germany (XETRA): ${baseSymbol}.DE (e.g., SAP.DE)\n`;
      errorMsg += `   • Hong Kong: ${baseSymbol}.HK (e.g., 0700.HK)\n`;
      errorMsg += `   • And many more...\n\n`;
    }
    
    errorMsg += `If the symbol is correct, the stock may not be available or the market may be closed.`;
    
    throw new Error(errorMsg);
  }
}

// Fetch stock historical data using Yahoo Finance
export async function getStockHistory(
  symbol: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<HistoricalData[]> {
  try {
    // Map interval to Yahoo Finance range - need more data for indicators
    const rangeMap: { [key: string]: string } = {
      daily: '3mo', // 3 months of daily data for better indicators
      weekly: '1y',
      monthly: '2y',
    };

    const range = rangeMap[interval] || '3mo';
    
    // Try Yahoo Finance first
    const yahooResponse = await axios.get(`${YAHOO_FINANCE_API}/${symbol.toUpperCase()}`, {
      params: {
        interval: '1d',
        range: range,
        includePrePost: 'false',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    if (yahooResponse.data?.chart?.result?.[0]) {
      const result = yahooResponse.data.chart.result[0];
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0];
      
      if (timestamps.length > 0 && quotes && quotes.close) {
        const history = timestamps
          .map((timestamp: number, index: number) => {
            const price = quotes.close[index] || quotes.open[index] || quotes.high[index] || quotes.low[index] || 0;
            return {
              date: new Date(timestamp * 1000).toISOString(),
              price: price,
              high: quotes.high[index] || quotes.open[index] || price,
              low: quotes.low[index] || quotes.open[index] || price,
              volume: quotes.volume[index] || 0,
            };
          })
          .filter((item: { date: string; price: number; high: number; low: number; volume: number }) => item.price > 0); // Filter out invalid prices
        
        // Sort by date (oldest first) for indicators calculation
        return history.sort((a: { date: string; price: number; high: number; low: number; volume: number }, b: { date: string; price: number; high: number; low: number; volume: number }) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }

    // Fallback to Alpha Vantage
    const functionName = interval === 'daily' ? 'TIME_SERIES_DAILY' : 
                        interval === 'weekly' ? 'TIME_SERIES_WEEKLY' : 
                        'TIME_SERIES_MONTHLY';
    
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: functionName,
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_KEY,
        outputsize: 'compact',
      },
      timeout: 10000,
    });

    // Check for API error messages
    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }
    
    if (response.data['Note']) {
      throw new Error('API rate limit exceeded.');
    }
    
    if (response.data['Information']) {
      throw new Error('API call frequency limit exceeded.');
    }

    const timeSeriesKey = Object.keys(response.data).find(key => 
      key.includes('Time Series')
    );
    
    if (!timeSeriesKey || !response.data[timeSeriesKey]) {
      return [];
    }

    const timeSeries = response.data[timeSeriesKey];
    return Object.entries(timeSeries)
      .map(([date, data]: [string, any]) => ({
        date,
        price: parseFloat(data['4. close'] || '0'),
        volume: parseInt(data['5. volume'] || '0'),
      }))
      .reverse();
  } catch (error: any) {
    console.error('Error fetching stock history:', error);
    // Return empty array on error, but log it
    return [];
  }
}

// Search cryptocurrencies
export async function searchCryptos(query: string): Promise<CryptoData[]> {
  try {
    // Encode the query to handle special characters
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await axios.get(
      `${COINGECKO_API}/search?query=${encodedQuery}`,
      {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      }
    );
    
    // Check if response has coins
    if (!response.data || !response.data.coins || response.data.coins.length === 0) {
      return [];
    }
    
    const coins = response.data.coins.slice(0, 10);
    const ids = coins.map((coin: any) => coin.id).join(',');
    
    if (!ids) {
      return [];
    }
    
    const marketResponse = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`,
      {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      }
    );
    
    // Check if market data is valid
    if (!marketResponse.data || !Array.isArray(marketResponse.data)) {
      return [];
    }
    
    return marketResponse.data;
  } catch (error: any) {
    console.error('Error searching cryptos:', error);
    // Return empty array instead of throwing - let the UI handle "no results"
    return [];
  }
}

