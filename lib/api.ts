import axios from 'axios';

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
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
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

// Fetch stock data using Yahoo Finance API (free, no key required)
export async function getStockQuote(symbol: string): Promise<StockData | null> {
  try {
    // Try Yahoo Finance first (free, no API key needed)
    // Using a more reliable endpoint with proper headers
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
      validateStatus: (status) => status < 500, // Accept 4xx as valid responses
    });

    // Check if we got valid data
    if (yahooResponse.data?.chart?.result?.[0]) {
      const result = yahooResponse.data.chart.result[0];
      const meta = result.meta;
      
      // Check if symbol exists
      if (!meta || !meta.symbol) {
        throw new Error(`Stock symbol "${symbol.toUpperCase()}" not found.`);
      }
      
      const quote = result.indicators?.quote?.[0];
      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
      const previousClose = meta.previousClose || currentPrice;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      if (currentPrice === 0) {
        throw new Error(`No price data available for "${symbol.toUpperCase()}"`);
      }

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
      };
    }

    // If no data in response, try fallback
    if (yahooResponse.data?.chart?.error) {
      throw new Error(yahooResponse.data.chart.error.description || 'Yahoo Finance API error');
    }

    throw new Error('Yahoo Finance API returned no data');
  } catch (yahooError: any) {
    // Fallback to Alpha Vantage API
    try {
      const response = await axios.get(ALPHA_VANTAGE_API, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
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
        throw new Error(`Stock symbol "${symbol.toUpperCase()}" not found. Please check the symbol.`);
      }
      
      if (quote['05. price'] === undefined || quote['05. price'] === '0.0000') {
        throw new Error(`No price data available for "${symbol.toUpperCase()}"`);
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change'] || '0');
      const changePercentStr = quote['10. change percent'] || '0%';
      const changePercent = parseFloat(changePercentStr.replace('%', ''));

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
      };
    } catch (alphaError: any) {
      // If both fail, provide a helpful error message
      const yahooMsg = yahooError?.message || 'Unknown error';
      const alphaMsg = alphaError?.message || 'Unknown error';
      
      throw new Error(
        `Unable to fetch stock data for "${symbol.toUpperCase()}". ` +
        `Yahoo Finance: ${yahooMsg}. Alpha Vantage: ${alphaMsg}. ` +
        `Please verify the symbol is correct and try again.`
      );
    }
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
      `${COINGECKO_API}/search?query=${encodedQuery}`
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
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`
    );
    
    // Check if market data is valid
    if (!marketResponse.data || !Array.isArray(marketResponse.data)) {
      return [];
    }
    
    return marketResponse.data;
  } catch (error: any) {
    console.error('Error searching cryptos:', error);
    // Re-throw the error so the component can handle it
    throw new Error(error.response?.data?.error || 'Failed to search cryptocurrencies');
  }
}

