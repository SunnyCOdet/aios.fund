export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  sma200: number;
  bollinger: { upper: number; middle: number; lower: number };
  stochastic: { k: number; d: number };
  adx: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
}

interface PricePoint {
  price: number;
  date: string;
  high?: number;
  low?: number;
  volume?: number;
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

// Calculate Bollinger Bands
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1] || 0;
    return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
  }

  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  
  // Calculate standard deviation
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev),
  };
}

// Calculate Stochastic Oscillator
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number; d: number } {
  if (closes.length < kPeriod) {
    return { k: 50, d: 50 };
  }

  const slice = closes.slice(-kPeriod);
  const highSlice = highs.slice(-kPeriod);
  const lowSlice = lows.slice(-kPeriod);

  const highestHigh = Math.max(...highSlice);
  const lowestLow = Math.min(...lowSlice);
  const currentClose = closes[closes.length - 1];

  if (highestHigh === lowestLow) {
    return { k: 50, d: 50 };
  }

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  // Calculate %D (simple moving average of %K)
  const kValues = [];
  for (let i = closes.length - dPeriod; i < closes.length; i++) {
    if (i >= kPeriod - 1) {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const periodCloses = closes.slice(i - kPeriod + 1, i + 1);
      const hh = Math.max(...periodHighs);
      const ll = Math.min(...periodLows);
      if (hh !== ll) {
        kValues.push(((periodCloses[periodCloses.length - 1] - ll) / (hh - ll)) * 100);
      }
    }
  }
  const d = kValues.length > 0 ? kValues.reduce((a, b) => a + b, 0) / kValues.length : k;

  return { k, d };
}

// Calculate ADX (Average Directional Index)
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period * 2 || lows.length < period * 2 || closes.length < period * 2) {
    return 25; // Neutral ADX
  }

  const trueRanges = [];
  const plusDMs = [];
  const minusDMs = [];

  for (let i = 1; i < closes.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));

    const plusDM = highs[i] > highs[i - 1] ? highs[i] - highs[i - 1] : 0;
    const minusDM = lows[i] < lows[i - 1] ? lows[i - 1] - lows[i] : 0;
    
    if (plusDM > minusDM) {
      plusDMs.push(plusDM);
      minusDMs.push(0);
    } else if (minusDM > plusDM) {
      plusDMs.push(0);
      minusDMs.push(minusDM);
    } else {
      plusDMs.push(0);
      minusDMs.push(0);
    }
  }

  if (trueRanges.length < period) {
    return 25;
  }

  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  const plusDI = plusDMs.slice(-period).reduce((a, b) => a + b, 0) / period;
  const minusDI = minusDMs.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (atr === 0) return 25;

  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  return isNaN(dx) ? 25 : Math.min(Math.max(dx, 0), 100);
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
      bollinger: { upper: lastPrice, middle: lastPrice, lower: lastPrice },
      stochastic: { k: 50, d: 50 },
      adx: 25,
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
  const bollinger = calculateBollingerBands(prices, 20, 2);

  // For Stochastic and ADX, we need high/low data
  // If historical data has high/low, use them; otherwise estimate
  const highs = historicalData.length > 0 && historicalData[0].high !== undefined
    ? historicalData.map(d => d.high || d.price)
    : prices.map(p => p * 1.02); // Estimate 2% higher
  const lows = historicalData.length > 0 && historicalData[0].low !== undefined
    ? historicalData.map(d => d.low || d.price)
    : prices.map(p => p * 0.98); // Estimate 2% lower

  const stochastic = calculateStochastic(highs, lows, prices, 14, 3);
  const adx = calculateADX(highs, lows, prices, 14);

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

  // Bollinger Bands signals
  if (currentPrice < bollinger.lower) buySignals.push(1); // Oversold
  else if (currentPrice > bollinger.upper) sellSignals.push(1); // Overbought

  // Stochastic signals
  if (stochastic.k < 20 && stochastic.d < 20) buySignals.push(1); // Oversold
  else if (stochastic.k > 80 && stochastic.d > 80) sellSignals.push(1); // Overbought

  // ADX signals (strength of trend)
  // ADX > 25 indicates strong trend, which strengthens other signals
  if (adx > 25) {
    if (trend === 'bullish') buySignals.push(1);
    else if (trend === 'bearish') sellSignals.push(1);
  }

  const buyScore = buySignals.length;
  const sellScore = sellSignals.length;
  const maxSignals = 7; // Updated max signals count

  if (buyScore > sellScore && buyScore >= 2) {
    recommendation = 'buy';
    confidence = Math.min((buyScore / maxSignals) * 100, 95);
  } else if (sellScore > buyScore && sellScore >= 2) {
    recommendation = 'sell';
    confidence = Math.min((sellScore / maxSignals) * 100, 95);
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
    bollinger,
    stochastic,
    adx,
    trend,
    recommendation,
    confidence,
  };
}

