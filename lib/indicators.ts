export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  sma200: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
}

interface PricePoint {
  price: number;
  date: string;
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate SMA (Simple Moving Average)
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

// Calculate EMA (Exponential Moving Average)
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Calculate MACD
export function calculateMACD(prices: number[]): {
  value: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // For signal line, we'd need historical MACD values, so we'll use a simplified version
  const signal = calculateEMA([macd], 9);
  const histogram = macd - signal;

  return {
    value: macd,
    signal,
    histogram,
  };
}

// Calculate all technical indicators and generate prediction
export function calculateIndicators(
  historicalData: PricePoint[]
): TechnicalIndicators {
  if (historicalData.length < 50) {
    // Use the last available price if we have data, otherwise default to 0
    const lastPrice = historicalData.length > 0 
      ? historicalData[historicalData.length - 1].price 
      : 0;
    
    return {
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      sma20: lastPrice,
      sma50: lastPrice,
      sma200: lastPrice,
      trend: 'neutral',
      recommendation: 'hold',
      confidence: 0,
    };
  }

  const prices = historicalData.map(d => d.price);
  const currentPrice = prices[prices.length - 1];

  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (sma20 > sma50 && sma50 > sma200 && currentPrice > sma20) {
    trend = 'bullish';
  } else if (sma20 < sma50 && sma50 < sma200 && currentPrice < sma20) {
    trend = 'bearish';
  }

  // Generate recommendation
  let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 0;

  const buySignals = [];
  const sellSignals = [];

  // RSI signals
  if (rsi < 30) buySignals.push(1);
  else if (rsi > 70) sellSignals.push(1);
  
  // MACD signals
  if (macd.histogram > 0 && macd.value > macd.signal) buySignals.push(1);
  else if (macd.histogram < 0 && macd.value < macd.signal) sellSignals.push(1);
  
  // Trend signals
  if (trend === 'bullish') buySignals.push(1);
  else if (trend === 'bearish') sellSignals.push(1);
  
  // Moving average crossover
  if (currentPrice > sma20 && sma20 > sma50) buySignals.push(1);
  else if (currentPrice < sma20 && sma20 < sma50) sellSignals.push(1);

  const buyScore = buySignals.length;
  const sellScore = sellSignals.length;

  if (buyScore > sellScore && buyScore >= 2) {
    recommendation = 'buy';
    confidence = Math.min((buyScore / 4) * 100, 95);
  } else if (sellScore > buyScore && sellScore >= 2) {
    recommendation = 'sell';
    confidence = Math.min((sellScore / 4) * 100, 95);
  } else {
    recommendation = 'hold';
    confidence = Math.max(50 - Math.abs(buyScore - sellScore) * 10, 20);
  }

  return {
    rsi,
    macd,
    sma20,
    sma50,
    sma200,
    trend,
    recommendation,
    confidence,
  };
}

