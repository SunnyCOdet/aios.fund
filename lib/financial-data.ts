/**
 * Financial Data Fetching Module
 * Fetches fundamental financial metrics for stocks and crypto
 */

import axios from 'axios';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface StockFinancials {
  peRatio?: number;
  eps?: number;
  priceToBook?: number;
  priceToSales?: number;
  profitMargin?: number;
  operatingMargin?: number;
  roa?: number;
  roe?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  debtToEquity?: number;
  currentRatio?: number;
  marketCap?: number;
  enterpriseValue?: number;
  sharesOutstanding?: number;
  dividendYield?: number;
}

export interface CryptoMetrics {
  totalSupply?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  marketCap?: number;
  fullyDilutedValuation?: number;
  totalValueLocked?: number;
  networkHashRate?: number;
  activeAddresses?: number;
  transactionVolume?: number;
}

/**
 * Fetch stock financial metrics from Yahoo Finance
 */
export async function getStockFinancials(symbol: string): Promise<StockFinancials> {
  try {
    // Try Yahoo Finance first
    const response = await axios.get(`${YAHOO_FINANCE_API}/${symbol.toUpperCase()}`, {
      params: {
        interval: '1d',
        range: '1d',
        modules: 'summaryDetail,defaultKeyStatistics,financialData,majorHoldersBreakdown',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    if (response.data?.quoteSummary?.result?.[0]) {
      const result = response.data.quoteSummary.result[0];
      const summaryDetail = result.summaryDetail || {};
      const defaultKeyStatistics = result.defaultKeyStatistics || {};
      const financialData = result.financialData || {};

      return {
        peRatio: summaryDetail.trailingPE?.raw || defaultKeyStatistics.trailingPE?.raw,
        eps: summaryDetail.trailingEps?.raw || defaultKeyStatistics.trailingEps?.raw,
        priceToBook: defaultKeyStatistics.priceToBook?.raw,
        priceToSales: defaultKeyStatistics.priceToSalesTrailing12Months?.raw,
        profitMargin: financialData.profitMargins?.raw,
        operatingMargin: financialData.operatingMargins?.raw,
        roa: defaultKeyStatistics.returnOnAssets?.raw,
        roe: defaultKeyStatistics.returnOnEquity?.raw,
        revenueGrowth: financialData.revenueGrowth?.raw,
        earningsGrowth: defaultKeyStatistics.earningsQuarterlyGrowth?.raw,
        debtToEquity: defaultKeyStatistics.debtToEquity?.raw,
        currentRatio: financialData.currentRatio?.raw,
        marketCap: summaryDetail.marketCap?.raw || defaultKeyStatistics.marketCap?.raw,
        enterpriseValue: defaultKeyStatistics.enterpriseValue?.raw,
        sharesOutstanding: defaultKeyStatistics.sharesOutstanding?.raw,
        dividendYield: summaryDetail.dividendYield?.raw || defaultKeyStatistics.yield?.raw,
      };
    }
  } catch (error) {
    console.error('Error fetching stock financials from Yahoo Finance:', error);
  }

  // Fallback: Try Alpha Vantage
  try {
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 10000,
    });

    if (response.data && !response.data['Error Message'] && !response.data['Note']) {
      const data = response.data;
      return {
        peRatio: data.PERatio ? parseFloat(data.PERatio) : undefined,
        eps: data.EPS ? parseFloat(data.EPS) : undefined,
        priceToBook: data.PriceToBookRatio ? parseFloat(data.PriceToBookRatio) : undefined,
        priceToSales: data.PriceToSalesRatioTTM ? parseFloat(data.PriceToSalesRatioTTM) : undefined,
        profitMargin: data.ProfitMargin ? parseFloat(data.ProfitMargin) : undefined,
        operatingMargin: data.OperatingMarginTTM ? parseFloat(data.OperatingMarginTTM) : undefined,
        roa: data.ReturnOnAssetsTTM ? parseFloat(data.ReturnOnAssetsTTM) : undefined,
        roe: data.ReturnOnEquityTTM ? parseFloat(data.ReturnOnEquityTTM) : undefined,
        revenueGrowth: data.QuarterlyRevenueGrowthYOY ? parseFloat(data.QuarterlyRevenueGrowthYOY) : undefined,
        earningsGrowth: data.QuarterlyEarningsGrowthYOY ? parseFloat(data.QuarterlyEarningsGrowthYOY) : undefined,
        debtToEquity: data.DebtToEquity ? parseFloat(data.DebtToEquity) : undefined,
        marketCap: data.MarketCapitalization ? parseFloat(data.MarketCapitalization) : undefined,
        sharesOutstanding: data.SharesOutstanding ? parseFloat(data.SharesOutstanding) : undefined,
        dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching stock financials from Alpha Vantage:', error);
  }

  return {};
}

/**
 * Fetch crypto metrics from CoinGecko
 */
export async function getCryptoMetrics(cryptoId: string): Promise<CryptoMetrics> {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/${cryptoId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: true,
        sparkline: false,
      },
      timeout: 10000,
      validateStatus: (status) => status < 500, // Accept 4xx as valid responses to handle gracefully
    });

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'] || '60';
      console.warn(`CoinGecko API rate limit exceeded. Retry after ${retryAfter} seconds. Continuing without crypto metrics.`);
      return {};
    }

    // Handle other 4xx errors
    if (response.status >= 400 && response.status < 500) {
      console.warn(`CoinGecko API returned ${response.status}. Continuing without crypto metrics.`);
      return {};
    }

    if (response.data && response.status === 200) {
      const data = response.data;
      return {
        totalSupply: data.market_data?.total_supply,
        circulatingSupply: data.market_data?.circulating_supply,
        maxSupply: data.market_data?.max_supply,
        marketCap: data.market_data?.market_cap?.usd,
        fullyDilutedValuation: data.market_data?.fully_diluted_valuation?.usd,
        totalValueLocked: data.market_data?.total_value_locked,
      };
    }
  } catch (error: any) {
    // Handle network errors and other exceptions
    if (error.response?.status === 429) {
      console.warn('CoinGecko API rate limit exceeded. Continuing without crypto metrics.');
    } else {
      console.error('Error fetching crypto metrics:', error.message || error);
    }
  }

  return {};
}

/**
 * Calculate financial ratios from available data
 */
export function calculateFinancialRatios(
  price: number,
  marketCap?: number,
  sharesOutstanding?: number,
  earnings?: number,
  revenue?: number,
  bookValue?: number
): Partial<StockFinancials> {
  const ratios: Partial<StockFinancials> = {};

  if (earnings && sharesOutstanding) {
    ratios.eps = earnings / sharesOutstanding;
  }

  if (price && ratios.eps) {
    ratios.peRatio = price / ratios.eps;
  }

  if (price && bookValue && sharesOutstanding) {
    ratios.priceToBook = (price * sharesOutstanding) / bookValue;
  }

  if (price && revenue && sharesOutstanding) {
    ratios.priceToSales = (price * sharesOutstanding) / revenue;
  }

  return ratios;
}

