/**
 * Stock Exchange APIs - Fetch data directly from respective country exchanges
 * 
 * This module attempts to fetch stock data directly from the official APIs of:
 * - NSE (National Stock Exchange of India) - .NS
 * - BSE (Bombay Stock Exchange, India) - .BO
 * - LSE (London Stock Exchange, UK) - .L
 * - TSE (Tokyo Stock Exchange, Japan) - .T
 * - TSX (Toronto Stock Exchange, Canada) - .TO, .V
 * - ASX (Australian Securities Exchange) - .AX
 * 
 * If the exchange API is unavailable, fails, or requires authentication,
 * the system automatically falls back to Yahoo Finance API which aggregates
 * data from all major exchanges worldwide.
 * 
 * Priority: Exchange API > Yahoo Finance > Alpha Vantage
 */

import axios from 'axios';

export interface ExchangeStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  currency: string;
  marketCap?: number;
}

/**
 * Fetch stock data from NSE (National Stock Exchange of India)
 * NSE has public APIs but may require proper headers and cookies
 */
export async function fetchFromNSE(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.NS', '').toUpperCase();
    
    // NSE public API - try multiple endpoints
    const endpoints = [
      `https://www.nseindia.com/api/quote-equity?symbol=${baseSymbol}`,
      `https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.nseindia.com/',
            'Origin': 'https://www.nseindia.com',
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
          maxRedirects: 5,
        });

        if (response.data) {
          // Try different response structures
          let priceInfo, info;
          
          if (response.data.priceInfo) {
            priceInfo = response.data.priceInfo;
            info = response.data.info || {};
          } else if (response.data.data && response.data.data[0]) {
            // Alternative structure
            const data = response.data.data[0];
            priceInfo = {
              lastPrice: data.lastPrice || data.ltp,
              previousClose: data.previousClose || data.prevClose,
              open: data.open,
              totalTradedVolume: data.totalTradedVolume || data.volume,
              intraDayHighLow: {
                max: data.intraDayHighLow?.max || data.high,
                min: data.intraDayHighLow?.min || data.low,
              },
            };
            info = { companyName: data.companyName || data.symbol };
          }

          if (priceInfo) {
            const currentPrice = parseFloat(priceInfo.lastPrice || priceInfo.close || '0');
            const previousClose = parseFloat(priceInfo.previousClose || currentPrice);
            const change = currentPrice - previousClose;
            const changePercent = previousClose ? (change / previousClose) * 100 : 0;

            return {
              symbol: `${baseSymbol}.NS`,
              name: info?.companyName || baseSymbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              volume: parseInt(priceInfo.totalTradedVolume || '0'),
              high: parseFloat(priceInfo.intraDayHighLow?.max || currentPrice),
              low: parseFloat(priceInfo.intraDayHighLow?.min || currentPrice),
              open: parseFloat(priceInfo.open || previousClose),
              currency: 'INR',
              marketCap: priceInfo.marketCap ? parseFloat(priceInfo.marketCap) : undefined,
            };
          }
        }
      } catch (err) {
        // Try next endpoint
        continue;
      }
    }
  } catch (error: any) {
    // Silently fail - will fall back to Yahoo Finance
    if (process.env.NODE_ENV === 'development') {
      console.log(`NSE API unavailable for ${symbol}, using fallback`);
    }
  }
  return null;
}

/**
 * Fetch stock data from BSE (Bombay Stock Exchange, India)
 */
export async function fetchFromBSE(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.BO', '').toUpperCase();
    
    // BSE has multiple API endpoints - try the most reliable ones
    const endpoints = [
      `https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w?scripcode=${baseSymbol}&flag=EQ`,
      `https://www.bseindia.com/corporates/List_Scrips.aspx`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/html',
            'Referer': 'https://www.bseindia.com/',
          },
          timeout: 10000,
          validateStatus: (status) => status < 500,
        });

        if (response.data) {
          let data;
          
          // Handle different response formats
          if (response.data.Data) {
            data = response.data.Data;
          } else if (response.data.data) {
            data = response.data.data;
          } else if (Array.isArray(response.data) && response.data.length > 0) {
            data = response.data[0];
          }

          if (data) {
            const currentPrice = parseFloat(data.LTP || data.ltp || data.Close || data.close || '0');
            const previousClose = parseFloat(data.PrevClose || data.prevClose || data.PreviousClose || currentPrice);
            const change = currentPrice - previousClose;
            const changePercent = previousClose ? (change / previousClose) * 100 : 0;

            return {
              symbol: `${baseSymbol}.BO`,
              name: data.ScripName || data.scripName || data.CompanyName || baseSymbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              volume: parseInt(data.Volume || data.volume || '0'),
              high: parseFloat(data.High || data.high || currentPrice),
              low: parseFloat(data.Low || data.low || currentPrice),
              open: parseFloat(data.Open || data.open || previousClose),
              currency: 'INR',
              marketCap: data.MarketCap ? parseFloat(data.MarketCap) : undefined,
            };
          }
        }
      } catch (err) {
        continue;
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`BSE API unavailable for ${symbol}, using fallback`);
    }
  }
  return null;
}

/**
 * Fetch stock data from LSE (London Stock Exchange, UK)
 */
export async function fetchFromLSE(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.L', '').toUpperCase();
    // LSE uses Yahoo Finance format, but we can try LSE-specific endpoints
    // LSE public data is limited, so we'll use a proxy approach
    const response = await axios.get(`https://www.londonstockexchange.com/lse-json-api/v1/equity/${baseSymbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    if (response.data) {
      const data = response.data;
      const currentPrice = parseFloat(data.price || data.last || '0');
      const previousClose = parseFloat(data.previousClose || currentPrice);
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: `${baseSymbol}.L`,
        name: data.name || baseSymbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(data.volume || '0'),
        high: parseFloat(data.high || currentPrice),
        low: parseFloat(data.low || currentPrice),
        open: parseFloat(data.open || previousClose),
        currency: 'GBP',
        marketCap: data.marketCap ? parseFloat(data.marketCap) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching from LSE:', error);
  }
  return null;
}

/**
 * Fetch stock data from TSE (Tokyo Stock Exchange, Japan)
 */
export async function fetchFromTSE(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.T', '').toUpperCase();
    // TSE public API (limited)
    const response = await axios.get(`https://quote.jpx.co.jp/jpx/v1/quotes/${baseSymbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    if (response.data && response.data.length > 0) {
      const data = response.data[0];
      const currentPrice = parseFloat(data.currentPrice || data.close || '0');
      const previousClose = parseFloat(data.previousClose || currentPrice);
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: `${baseSymbol}.T`,
        name: data.companyName || baseSymbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(data.volume || '0'),
        high: parseFloat(data.high || currentPrice),
        low: parseFloat(data.low || currentPrice),
        open: parseFloat(data.open || previousClose),
        currency: 'JPY',
        marketCap: data.marketCap ? parseFloat(data.marketCap) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching from TSE:', error);
  }
  return null;
}

/**
 * Fetch stock data from TSX (Toronto Stock Exchange, Canada)
 */
export async function fetchFromTSX(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.TO', '').replace('.V', '').toUpperCase();
    // TSX public endpoint
    const response = await axios.get(`https://www.tsx.com/json/company-directory/search/tsx/${baseSymbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    // TSX API structure may vary, this is a placeholder
    if (response.data) {
      // Parse TSX response format
      const data = response.data;
      const currentPrice = parseFloat(data.price || data.last || '0');
      const previousClose = parseFloat(data.previousClose || currentPrice);
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: symbol.includes('.V') ? `${baseSymbol}.V` : `${baseSymbol}.TO`,
        name: data.name || baseSymbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(data.volume || '0'),
        high: parseFloat(data.high || currentPrice),
        low: parseFloat(data.low || currentPrice),
        open: parseFloat(data.open || previousClose),
        currency: 'CAD',
        marketCap: data.marketCap ? parseFloat(data.marketCap) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching from TSX:', error);
  }
  return null;
}

/**
 * Fetch stock data from ASX (Australian Securities Exchange)
 */
export async function fetchFromASX(symbol: string): Promise<ExchangeStockData | null> {
  try {
    const baseSymbol = symbol.replace('.AX', '').toUpperCase();
    // ASX public API
    const response = await axios.get(`https://www.asx.com.au/asx/1/share/${baseSymbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    if (response.data) {
      const data = response.data;
      const currentPrice = parseFloat(data.last_price || data.price || '0');
      const previousClose = parseFloat(data.previous_close || currentPrice);
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: `${baseSymbol}.AX`,
        name: data.name || baseSymbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: parseInt(data.volume || '0'),
        high: parseFloat(data.day_high || currentPrice),
        low: parseFloat(data.day_low || currentPrice),
        open: parseFloat(data.open_price || previousClose),
        currency: 'AUD',
        marketCap: data.market_cap ? parseFloat(data.market_cap) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching from ASX:', error);
  }
  return null;
}

/**
 * Route to appropriate exchange API based on symbol
 */
export async function fetchFromExchange(symbol: string): Promise<ExchangeStockData | null> {
  const upperSymbol = symbol.toUpperCase();
  
  // Route to appropriate exchange
  if (upperSymbol.endsWith('.NS')) {
    return await fetchFromNSE(symbol);
  } else if (upperSymbol.endsWith('.BO')) {
    return await fetchFromBSE(symbol);
  } else if (upperSymbol.endsWith('.L')) {
    return await fetchFromLSE(symbol);
  } else if (upperSymbol.endsWith('.T')) {
    return await fetchFromTSE(symbol);
  } else if (upperSymbol.endsWith('.TO') || upperSymbol.endsWith('.V')) {
    return await fetchFromTSX(symbol);
  } else if (upperSymbol.endsWith('.AX')) {
    return await fetchFromASX(symbol);
  }
  
  // No exchange-specific API available
  return null;
}

