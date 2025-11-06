/**
 * Production-Ready Quantitative Analysis System
 * Comprehensive financial analysis with statistical methods, risk assessment, and AI-powered insights
 */

export interface PriceData {
  date: string;
  price: number;
  high?: number;
  low?: number;
  volume?: number;
  open?: number;
  close?: number;
}

export interface FinancialMetrics {
  // Valuation Metrics
  peRatio?: number; // Price-to-Earnings
  eps?: number; // Earnings Per Share
  priceToBook?: number;
  priceToSales?: number;
  evToEbitda?: number; // Enterprise Value to EBITDA
  
  // Profitability Metrics
  profitMargin?: number;
  operatingMargin?: number;
  roa?: number; // Return on Assets
  roe?: number; // Return on Equity
  roic?: number; // Return on Invested Capital
  
  // Growth Metrics
  revenueGrowth?: number;
  earningsGrowth?: number;
  revenueGrowthYoY?: number;
  earningsGrowthYoY?: number;
  
  // Financial Health
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  debtToAssets?: number;
  
  // Market Metrics
  marketCap?: number;
  enterpriseValue?: number;
  sharesOutstanding?: number;
  dividendYield?: number;
  
  // Crypto-specific
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  networkHashRate?: number;
  activeAddresses?: number;
  transactionVolume?: number;
}

export interface StatisticalAnalysis {
  // Descriptive Statistics
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  range: number;
  
  // Correlation Analysis
  priceVolumeCorrelation: number;
  priceChangeCorrelation: number;
  
  // Regression Analysis
  linearRegression: {
    slope: number;
    intercept: number;
    rSquared: number;
    pValue: number;
  };
  
  // Time Series Analysis
  autocorrelation: number[];
  trendStrength: number;
  seasonality: number;
  
  // Volatility Analysis
  volatility: number; // Standard deviation of returns
  annualizedVolatility: number;
  realizedVolatility: number;
  
  // Distribution Analysis
  distributionType: 'normal' | 'skewed' | 'fat-tailed' | 'unknown';
  normalityTest: {
    shapiroWilk?: number;
    isNormal: boolean;
  };
}

export interface RiskMetrics {
  // Volatility Metrics
  volatility: number;
  annualizedVolatility: number;
  beta?: number; // Market correlation (for stocks)
  
  // Drawdown Analysis
  maxDrawdown: number;
  maxDrawdownDuration: number;
  currentDrawdown: number;
  averageDrawdown: number;
  
  // Value at Risk (VaR)
  var95: number; // 95% VaR
  var99: number; // 99% VaR
  cvar95: number; // Conditional VaR (Expected Shortfall)
  cvar99: number;
  
  // Risk-Adjusted Returns
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio?: number;
  
  // Downside Risk
  downsideDeviation: number;
  semiVariance: number;
  lowerPartialMoment: number;
  
  // Tail Risk
  tailRatio: number;
  tailRisk: number;
  
  // Risk Score (0-100, higher = riskier)
  overallRiskScore: number;
}

export interface TradingSignals {
  // Signal Strength (-100 to +100)
  signalStrength: number;
  
  // Primary Signals
  buySignal: boolean;
  sellSignal: boolean;
  holdSignal: boolean;
  
  // Signal Components
  technicalSignal: number; // -100 to +100
  fundamentalSignal: number; // -100 to +100
  sentimentSignal: number; // -100 to +100
  riskSignal: number; // -100 to +100 (negative = risky)
  
  // Entry/Exit Points
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  
  // Confidence Level (0-100)
  confidence: number;
  
  // Signal Details
  reasons: string[];
  warnings: string[];
  
  // Time Horizon
  timeHorizon: 'short' | 'medium' | 'long';
}

export interface QuantitativeAnalysis {
  // Asset Information
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto';
  timestamp: string;
  
  // Financial Metrics
  financialMetrics: FinancialMetrics;
  
  // Statistical Analysis
  statisticalAnalysis: StatisticalAnalysis;
  
  // Risk Assessment
  riskMetrics: RiskMetrics;
  
  // Trading Signals
  tradingSignals: TradingSignals;
  
  // Price Analysis
  priceAnalysis: {
    currentPrice: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    priceChange7d: number;
    priceChange30d: number;
    priceChange90d: number;
    priceChange1y: number;
    allTimeHigh?: number;
    allTimeLow?: number;
    distanceFromATH?: number;
    distanceFromATL?: number;
  };
  
  // Volume Analysis
  volumeAnalysis: {
    averageVolume: number;
    volumeRatio: number; // Current volume / Average volume
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    volumePriceDivergence: number;
  };
  
  // Pattern Recognition
  patterns: {
    supportLevels: number[];
    resistanceLevels: number[];
    trendLines: Array<{ start: number; end: number; slope: number }>;
    chartPatterns: string[];
  };
}

/**
 * Calculate descriptive statistics
 */
export function calculateDescriptiveStats(data: number[]): {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
} {
  if (data.length === 0) {
    return {
      mean: 0, median: 0, mode: 0, stdDev: 0, variance: 0,
      min: 0, max: 0, range: 0
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Mode (most frequent value, simplified)
  const frequency: { [key: number]: number } = {};
  data.forEach(val => {
    const rounded = Math.round(val * 100) / 100;
    frequency[rounded] = (frequency[rounded] || 0) + 1;
  });
  const mode = parseFloat(Object.keys(frequency).reduce((a, b) => 
    frequency[parseFloat(a)] > frequency[parseFloat(b)] ? a : b
  ));

  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  return { mean, median, mode, stdDev, variance, min, max, range };
}

/**
 * Calculate skewness (measure of asymmetry)
 */
export function calculateSkewness(data: number[]): number {
  if (data.length < 3) return 0;
  
  const stats = calculateDescriptiveStats(data);
  const n = data.length;
  const sum = data.reduce((acc, val) => {
    const diff = (val - stats.mean) / stats.stdDev;
    return acc + Math.pow(diff, 3);
  }, 0);
  
  return (n / ((n - 1) * (n - 2))) * sum;
}

/**
 * Calculate kurtosis (measure of tail heaviness)
 */
export function calculateKurtosis(data: number[]): number {
  if (data.length < 4) return 3; // Normal distribution kurtosis
  
  const stats = calculateDescriptiveStats(data);
  const n = data.length;
  const sum = data.reduce((acc, val) => {
    const diff = (val - stats.mean) / stats.stdDev;
    return acc + Math.pow(diff, 4);
  }, 0);
  
  const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
                   (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
  
  return kurtosis;
}

/**
 * Calculate correlation coefficient
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Linear regression analysis
 */
export function calculateLinearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  pValue: number;
} {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, pValue: 1 };
  }
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    sumXY += diffX * diffY;
    sumX2 += diffX * diffX;
    sumY2 += diffY * diffY;
  }
  
  const slope = sumX2 === 0 ? 0 : sumXY / sumX2;
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared
  const correlation = calculateCorrelation(x, y);
  const rSquared = correlation * correlation;
  
  // Simplified p-value calculation (t-test)
  const stdError = Math.sqrt((sumY2 - slope * sumXY) / (n - 2));
  const tStat = slope / (stdError / Math.sqrt(sumX2));
  const pValue = Math.min(1, Math.max(0, 1 - Math.abs(tStat) / 10)); // Simplified
  
  return { slope, intercept, rSquared, pValue };
}

/**
 * Calculate returns from price data
 */
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function calculateVolatility(returns: number[], annualized: boolean = true): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualize if daily returns (assuming 252 trading days)
  return annualized ? stdDev * Math.sqrt(252) : stdDev;
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(prices: number[]): {
  maxDrawdown: number;
  maxDrawdownDuration: number;
  currentDrawdown: number;
  averageDrawdown: number;
} {
  if (prices.length < 2) {
    return { maxDrawdown: 0, maxDrawdownDuration: 0, currentDrawdown: 0, averageDrawdown: 0 };
  }
  
  let maxDrawdown = 0;
  let maxDrawdownDuration = 0;
  let peak = prices[0];
  let peakIndex = 0;
  let currentDrawdown = 0;
  const drawdowns: number[] = [];
  let currentDrawdownStart = -1;
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
      peakIndex = i;
      if (currentDrawdownStart >= 0) {
        maxDrawdownDuration = Math.max(maxDrawdownDuration, i - currentDrawdownStart);
        currentDrawdownStart = -1;
      }
    } else {
      const drawdown = (peak - prices[i]) / peak;
      drawdowns.push(drawdown);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      
      if (currentDrawdownStart < 0) {
        currentDrawdownStart = peakIndex;
      }
      
      if (i === prices.length - 1) {
        currentDrawdown = drawdown;
        maxDrawdownDuration = Math.max(maxDrawdownDuration, i - currentDrawdownStart);
      }
    }
  }
  
  const averageDrawdown = drawdowns.length > 0
    ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
    : 0;
  
  return { maxDrawdown, maxDrawdownDuration, currentDrawdown, averageDrawdown };
}

/**
 * Calculate Value at Risk (VaR)
 */
export function calculateVaR(returns: number[], confidence: number = 0.95): number {
  if (returns.length === 0) return 0;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[index] || 0);
}

/**
 * Calculate Conditional VaR (Expected Shortfall)
 */
export function calculateCVaR(returns: number[], confidence: number = 0.95): number {
  if (returns.length === 0) return 0;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor((1 - confidence) * sorted.length);
  const tailReturns = sorted.slice(0, varIndex + 1);
  
  return tailReturns.length > 0
    ? Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length)
    : 0;
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length < 2) return 0;
  
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = calculateVolatility(returns, true);
  
  if (volatility === 0) return 0;
  
  // Annualize mean return (assuming daily returns)
  const annualizedReturn = meanReturn * 252;
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Sortino Ratio (downside deviation only)
 */
export function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length < 2) return 0;
  
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < 0);
  
  if (downsideReturns.length === 0) return 100; // No downside risk
  
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
  
  if (downsideDeviation === 0) return 100;
  
  const annualizedReturn = meanReturn * 252;
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Calmar Ratio (return / max drawdown)
 */
export function calculateCalmarRatio(returns: number[], maxDrawdown: number): number {
  if (maxDrawdown === 0) return 0;
  
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualizedReturn = meanReturn * 252;
  
  return annualizedReturn / maxDrawdown;
}

/**
 * Calculate autocorrelation (for time series analysis)
 */
export function calculateAutocorrelation(data: number[], maxLag: number = 10): number[] {
  const autocorrs: number[] = [];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  
  if (variance === 0) return new Array(maxLag).fill(0);
  
  for (let lag = 1; lag <= maxLag && lag < data.length; lag++) {
    let covariance = 0;
    for (let i = lag; i < data.length; i++) {
      covariance += (data[i] - mean) * (data[i - lag] - mean);
    }
    autocorrs.push(covariance / ((data.length - lag) * variance));
  }
  
  return autocorrs;
}

/**
 * Identify support and resistance levels
 */
export function identifySupportResistance(prices: number[]): {
  supportLevels: number[];
  resistanceLevels: number[];
} {
  if (prices.length < 20) {
    return { supportLevels: [], resistanceLevels: [] };
  }
  
  // Use local minima for support, local maxima for resistance
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];
  const window = Math.floor(prices.length / 10);
  
  for (let i = window; i < prices.length - window; i++) {
    const windowPrices = prices.slice(i - window, i + window + 1);
    const currentPrice = prices[i];
    const isLocalMin = currentPrice === Math.min(...windowPrices);
    const isLocalMax = currentPrice === Math.max(...windowPrices);
    
    if (isLocalMin) {
      supportLevels.push(currentPrice);
    }
    if (isLocalMax) {
      resistanceLevels.push(currentPrice);
    }
  }
  
  // Remove duplicates and sort
  const uniqueSupport = [...new Set(supportLevels)].sort((a, b) => a - b);
  const uniqueResistance = [...new Set(resistanceLevels)].sort((a, b) => b - a);
  
  return {
    supportLevels: uniqueSupport.slice(0, 5), // Top 5 support levels
    resistanceLevels: uniqueResistance.slice(0, 5), // Top 5 resistance levels
  };
}

/**
 * Comprehensive quantitative analysis
 */
export function performQuantitativeAnalysis(
  priceData: PriceData[],
  financialMetrics?: FinancialMetrics,
  assetType: 'stock' | 'crypto' = 'stock'
): QuantitativeAnalysis {
  if (priceData.length < 2) {
    throw new Error('Insufficient data for quantitative analysis');
  }
  
  const prices = priceData.map(d => d.price);
  const volumes = priceData.map(d => d.volume || 0).filter(v => v > 0);
  const returns = calculateReturns(prices);
  const currentPrice = prices[prices.length - 1];
  
  // Descriptive Statistics
  const stats = calculateDescriptiveStats(prices);
  const returnStats = calculateDescriptiveStats(returns);
  const skewness = calculateSkewness(returns);
  const kurtosis = calculateKurtosis(returns);
  
  // Correlation Analysis
  const priceVolumeCorrelation = volumes.length > 0 && prices.length === volumes.length
    ? calculateCorrelation(prices, volumes)
    : 0;
  
  const priceChanges = returns.map(r => r);
  const priceChangeCorrelation = priceChanges.length > 1
    ? calculateCorrelation(priceChanges.slice(0, -1), priceChanges.slice(1))
    : 0;
  
  // Regression Analysis
  const timeIndices = prices.map((_, i) => i);
  const linearRegression = calculateLinearRegression(timeIndices, prices);
  
  // Volatility Analysis
  const volatility = calculateVolatility(returns, false);
  const annualizedVolatility = calculateVolatility(returns, true);
  
  // Risk Metrics
  const drawdowns = calculateMaxDrawdown(prices);
  const var95 = calculateVaR(returns, 0.95);
  const var99 = calculateVaR(returns, 0.99);
  const cvar95 = calculateCVaR(returns, 0.95);
  const cvar99 = calculateCVaR(returns, 0.99);
  
  const sharpeRatio = calculateSharpeRatio(returns);
  const sortinoRatio = calculateSortinoRatio(returns);
  const calmarRatio = calculateCalmarRatio(returns, drawdowns.maxDrawdown);
  
  // Downside Risk
  const downsideReturns = returns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 0
    ? downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);
  const semiVariance = downsideVariance;
  
  // Risk Score (0-100)
  const riskScore = Math.min(100, Math.max(0,
    (drawdowns.maxDrawdown * 50) +
    (annualizedVolatility * 20) +
    (var95 * 30)
  ));
  
  // Price Analysis
  const priceChange24h = priceData.length >= 2
    ? currentPrice - priceData[priceData.length - 2].price
    : 0;
  const priceChangePercent24h = priceData.length >= 2 && priceData[priceData.length - 2].price !== 0
    ? (priceChange24h / priceData[priceData.length - 2].price) * 100
    : 0;
  
  const priceChange7d = priceData.length >= 7
    ? currentPrice - priceData[priceData.length - 7].price
    : 0;
  const priceChange30d = priceData.length >= 30
    ? currentPrice - priceData[priceData.length - 30].price
    : 0;
  const priceChange90d = priceData.length >= 90
    ? currentPrice - priceData[priceData.length - 90].price
    : 0;
  const priceChange1y = priceData.length >= 252
    ? currentPrice - priceData[priceData.length - 252].price
    : 0;
  
  const allTimeHigh = Math.max(...prices);
  const allTimeLow = Math.min(...prices);
  
  // Volume Analysis
  const averageVolume = volumes.length > 0
    ? volumes.reduce((a, b) => a + b, 0) / volumes.length
    : 0;
  const currentVolume = volumes[volumes.length - 1] || 0;
  const volumeRatio = averageVolume > 0 ? currentVolume / averageVolume : 1;
  const volumeTrend = volumes.length >= 3
    ? (volumes[volumes.length - 1] > volumes[volumes.length - 3] ? 'increasing' : 'decreasing')
    : 'stable';
  
  // Pattern Recognition
  const supportResistance = identifySupportResistance(prices);
  
  // Autocorrelation
  const autocorrelation = calculateAutocorrelation(returns, 10);
  
  // Trading Signals (simplified - will be enhanced by AI)
  const technicalSignal = 
    (linearRegression.slope > 0 ? 30 : -30) +
    (sharpeRatio > 1 ? 20 : sharpeRatio < 0 ? -20 : 0) +
    (drawdowns.currentDrawdown < 0.1 ? 20 : drawdowns.currentDrawdown > 0.3 ? -20 : 0) +
    (volumeRatio > 1.2 ? 20 : volumeRatio < 0.8 ? -20 : 0) +
    (priceChangePercent24h > 5 ? 10 : priceChangePercent24h < -5 ? -10 : 0);
  
  const fundamentalSignal = financialMetrics
    ? (financialMetrics.peRatio && financialMetrics.peRatio < 15 ? 20 : financialMetrics.peRatio && financialMetrics.peRatio > 30 ? -20 : 0) +
      (financialMetrics.profitMargin && financialMetrics.profitMargin > 0.15 ? 20 : financialMetrics.profitMargin && financialMetrics.profitMargin < 0 ? -20 : 0) +
      (financialMetrics.revenueGrowth && financialMetrics.revenueGrowth > 0.1 ? 20 : financialMetrics.revenueGrowth && financialMetrics.revenueGrowth < 0 ? -20 : 0) +
      (financialMetrics.debtToEquity && financialMetrics.debtToEquity < 1 ? 10 : financialMetrics.debtToEquity && financialMetrics.debtToEquity > 2 ? -10 : 0)
    : 0;
  
  const signalStrength = Math.max(-100, Math.min(100, technicalSignal + fundamentalSignal));
  
  return {
    symbol: '',
    name: '',
    assetType,
    timestamp: new Date().toISOString(),
    financialMetrics: financialMetrics || {},
    statisticalAnalysis: {
      mean: stats.mean,
      median: stats.median,
      mode: stats.mode,
      stdDev: stats.stdDev,
      variance: stats.variance,
      skewness,
      kurtosis,
      min: stats.min,
      max: stats.max,
      range: stats.range,
      priceVolumeCorrelation,
      priceChangeCorrelation,
      linearRegression,
      autocorrelation,
      trendStrength: Math.abs(linearRegression.slope) / stats.mean,
      seasonality: 0, // Would require more sophisticated analysis
      volatility,
      annualizedVolatility,
      realizedVolatility: annualizedVolatility,
      distributionType: Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 1 ? 'normal' : 
                        Math.abs(skewness) > 1 ? 'skewed' : 
                        Math.abs(kurtosis - 3) > 2 ? 'fat-tailed' : 'unknown',
      normalityTest: {
        isNormal: Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 1,
      },
    },
    riskMetrics: {
      volatility,
      annualizedVolatility,
      maxDrawdown: drawdowns.maxDrawdown,
      maxDrawdownDuration: drawdowns.maxDrawdownDuration,
      currentDrawdown: drawdowns.currentDrawdown,
      averageDrawdown: drawdowns.averageDrawdown,
      var95,
      var99,
      cvar95,
      cvar99,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      downsideDeviation,
      semiVariance,
      lowerPartialMoment: semiVariance,
      tailRatio: var99 / var95,
      tailRisk: cvar99,
      overallRiskScore: riskScore,
    },
    tradingSignals: {
      signalStrength,
      buySignal: signalStrength > 30,
      sellSignal: signalStrength < -30,
      holdSignal: signalStrength >= -30 && signalStrength <= 30,
      technicalSignal,
      fundamentalSignal,
      sentimentSignal: 0, // Will be set by AI analysis
      riskSignal: -riskScore,
      confidence: Math.min(95, Math.max(20, Math.abs(signalStrength))),
      reasons: [],
      warnings: riskScore > 70 ? ['High risk detected'] : [],
      timeHorizon: 'medium',
    },
    priceAnalysis: {
      currentPrice,
      priceChange24h,
      priceChangePercent24h,
      priceChange7d,
      priceChange30d,
      priceChange90d,
      priceChange1y,
      allTimeHigh,
      allTimeLow,
      distanceFromATH: ((currentPrice - allTimeHigh) / allTimeHigh) * 100,
      distanceFromATL: ((currentPrice - allTimeLow) / allTimeLow) * 100,
    },
    volumeAnalysis: {
      averageVolume,
      volumeRatio,
      volumeTrend,
      volumePriceDivergence: priceVolumeCorrelation,
    },
    patterns: {
      supportLevels: supportResistance.supportLevels,
      resistanceLevels: supportResistance.resistanceLevels,
      trendLines: [],
      chartPatterns: [],
    },
  };
}

