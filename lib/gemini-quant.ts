/**
 * Recursive Gemini AI Quantitative Analysis System
 * Uses iterative prompting loops to perform deep quantitative analysis
 */

import axios from 'axios';
import { QuantitativeAnalysis, FinancialMetrics, RiskMetrics, TradingSignals } from './quant-analysis';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface RecursiveAnalysisResult {
  initialAnalysis: QuantitativeAnalysis;
  aiEnhancedAnalysis: {
    financialInsights: string;
    statisticalInsights: string;
    riskAssessment: string;
    tradingRecommendation: string;
    marketOutlook: string;
    keyFindings: string[];
    warnings: string[];
    opportunities: string[];
    threats: string[];
  };
  deepDiveAnalysis: {
    patternRecognition: string;
    correlationAnalysis: string;
    predictiveInsights: string;
    alternativeDataInsights: string;
  };
  finalRecommendation: {
    action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    reasoning: string;
    priceTarget?: number;
    stopLoss?: number;
    takeProfit?: number;
    timeHorizon: string;
  };
  iterationCount: number;
  analysisDepth: 'surface' | 'moderate' | 'deep' | 'comprehensive';
}

/**
 * Recursive prompting function - iteratively refines analysis
 */
async function recursivePrompt(
  apiKey: string,
  prompt: string,
  previousContext: string[] = [],
  maxIterations: number = 3,
  currentIteration: number = 0
): Promise<string> {
  if (currentIteration >= maxIterations) {
    return previousContext[previousContext.length - 1] || '';
  }

  const contextPrompt = previousContext.length > 0
    ? `Previous analysis context:\n${previousContext.join('\n\n---\n\n')}\n\n`
    : '';

  const fullPrompt = `${contextPrompt}${prompt}\n\n${
    currentIteration > 0
      ? 'Based on the previous analysis, provide deeper insights and refine your assessment. Focus on areas that need more investigation.'
      : 'Provide a comprehensive initial analysis.'
  }`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
    
    if (!text || text.trim().length < 100) {
      return previousContext[previousContext.length - 1] || '';
    }

    const newContext = [...previousContext, text];

    // Check if we need deeper analysis
    const needsDeeperAnalysis = 
      text.toLowerCase().includes('uncertain') ||
      text.toLowerCase().includes('inconclusive') ||
      text.toLowerCase().includes('requires further') ||
      text.toLowerCase().includes('limited data');

    if (needsDeeperAnalysis && currentIteration < maxIterations - 1) {
      return recursivePrompt(
        apiKey,
        `Dive deeper into the uncertain areas. Provide more specific analysis with quantitative reasoning.`,
        newContext,
        maxIterations,
        currentIteration + 1
      );
    }

    return text;
  } catch (error: any) {
    console.error(`Error in recursive prompt iteration ${currentIteration}:`, error);
    return previousContext[previousContext.length - 1] || 'Analysis unavailable';
  }
}

/**
 * Perform comprehensive recursive quantitative analysis
 */
export async function performRecursiveQuantAnalysis(
  apiKey: string,
  quantAnalysis: QuantitativeAnalysis,
  financialMetrics?: FinancialMetrics,
  newsData?: any[],
  sentimentData?: any,
  historicalData?: any[]
): Promise<RecursiveAnalysisResult> {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const analysisDepth = 
    historicalData && historicalData.length > 200 ? 'comprehensive' :
    historicalData && historicalData.length > 100 ? 'deep' :
    historicalData && historicalData.length > 50 ? 'moderate' : 'surface';

  // Build comprehensive data context
  const dataContext = `
ASSET INFORMATION:
- Symbol: ${quantAnalysis.symbol}
- Name: ${quantAnalysis.name}
- Type: ${quantAnalysis.assetType}
- Current Price: $${quantAnalysis.priceAnalysis.currentPrice.toFixed(2)}
- 24h Change: ${quantAnalysis.priceAnalysis.priceChangePercent24h.toFixed(2)}%

FINANCIAL METRICS:
${financialMetrics ? `
- P/E Ratio: ${financialMetrics.peRatio?.toFixed(2) || 'N/A'}
- EPS: $${financialMetrics.eps?.toFixed(2) || 'N/A'}
- Profit Margin: ${financialMetrics.profitMargin ? (financialMetrics.profitMargin * 100).toFixed(2) + '%' : 'N/A'}
- Revenue Growth: ${financialMetrics.revenueGrowth ? (financialMetrics.revenueGrowth * 100).toFixed(2) + '%' : 'N/A'}
- ROA: ${financialMetrics.roa ? (financialMetrics.roa * 100).toFixed(2) + '%' : 'N/A'}
- ROE: ${financialMetrics.roe ? (financialMetrics.roe * 100).toFixed(2) + '%' : 'N/A'}
- Debt-to-Equity: ${financialMetrics.debtToEquity?.toFixed(2) || 'N/A'}
- Market Cap: ${financialMetrics.marketCap ? `$${(financialMetrics.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
` : 'Financial metrics not available'}

STATISTICAL ANALYSIS:
- Mean Price: $${quantAnalysis.statisticalAnalysis.mean.toFixed(2)}
- Standard Deviation: $${quantAnalysis.statisticalAnalysis.stdDev.toFixed(2)}
- Volatility (Annualized): ${(quantAnalysis.statisticalAnalysis.annualizedVolatility * 100).toFixed(2)}%
- Skewness: ${quantAnalysis.statisticalAnalysis.skewness.toFixed(3)}
- Kurtosis: ${quantAnalysis.statisticalAnalysis.kurtosis.toFixed(3)}
- Price-Volume Correlation: ${quantAnalysis.statisticalAnalysis.priceVolumeCorrelation.toFixed(3)}
- Linear Regression R²: ${quantAnalysis.statisticalAnalysis.linearRegression.rSquared.toFixed(3)}
- Trend Strength: ${quantAnalysis.statisticalAnalysis.trendStrength.toFixed(3)}

RISK METRICS:
- Sharpe Ratio: ${quantAnalysis.riskMetrics.sharpeRatio.toFixed(3)}
- Sortino Ratio: ${quantAnalysis.riskMetrics.sortinoRatio.toFixed(3)}
- Calmar Ratio: ${quantAnalysis.riskMetrics.calmarRatio.toFixed(3)}
- Max Drawdown: ${(quantAnalysis.riskMetrics.maxDrawdown * 100).toFixed(2)}%
- Current Drawdown: ${(quantAnalysis.riskMetrics.currentDrawdown * 100).toFixed(2)}%
- VaR (95%): ${(quantAnalysis.riskMetrics.var95 * 100).toFixed(2)}%
- VaR (99%): ${(quantAnalysis.riskMetrics.var99 * 100).toFixed(2)}%
- Overall Risk Score: ${quantAnalysis.riskMetrics.overallRiskScore.toFixed(1)}/100

TRADING SIGNALS:
- Signal Strength: ${quantAnalysis.tradingSignals.signalStrength.toFixed(1)}/100
- Technical Signal: ${quantAnalysis.tradingSignals.technicalSignal.toFixed(1)}/100
- Fundamental Signal: ${quantAnalysis.tradingSignals.fundamentalSignal.toFixed(1)}/100
- Confidence: ${quantAnalysis.tradingSignals.confidence.toFixed(1)}%

PRICE ANALYSIS:
- 7d Change: ${quantAnalysis.priceAnalysis.priceChange7d.toFixed(2)}%
- 30d Change: ${quantAnalysis.priceAnalysis.priceChange30d.toFixed(2)}%
- 90d Change: ${quantAnalysis.priceAnalysis.priceChange90d.toFixed(2)}%
- Distance from ATH: ${quantAnalysis.priceAnalysis.distanceFromATH?.toFixed(2) || 'N/A'}%
- Distance from ATL: ${quantAnalysis.priceAnalysis.distanceFromATL?.toFixed(2) || 'N/A'}%

VOLUME ANALYSIS:
- Volume Ratio: ${quantAnalysis.volumeAnalysis.volumeRatio.toFixed(2)}x
- Volume Trend: ${quantAnalysis.volumeAnalysis.volumeTrend}
- Price-Volume Divergence: ${quantAnalysis.volumeAnalysis.volumePriceDivergence.toFixed(3)}

SUPPORT/RESISTANCE:
- Support Levels: ${quantAnalysis.patterns.supportLevels.map(s => `$${s.toFixed(2)}`).join(', ')}
- Resistance Levels: ${quantAnalysis.patterns.resistanceLevels.map(r => `$${r.toFixed(2)}`).join(', ')}
`;

  const newsContext = newsData && newsData.length > 0
    ? `\nRECENT NEWS (${newsData.length} articles):\n${newsData.slice(0, 10).map((n: any, i: number) => 
        `${i + 1}. ${n.title}\n   ${n.description || n.content || ''}`
      ).join('\n\n')}`
    : '';

  const sentimentContext = sentimentData
    ? `\nMARKET SENTIMENT:\n- Overall: ${sentimentData.overall || 'Neutral'}\n- Positive: ${sentimentData.positive || 0}%\n- Negative: ${sentimentData.negative || 0}%`
    : '';

  // Iteration 1: Financial Insights
  const financialPrompt = `As a quantitative analyst, analyze the financial metrics and provide insights. Focus on:
1. Valuation assessment (is the asset overvalued/undervalued?)
2. Profitability analysis
3. Growth prospects
4. Financial health and stability
5. Comparison to industry peers (if applicable)

${dataContext}${financialMetrics ? '' : '\nNote: Limited financial metrics available. Provide analysis based on available data.'}`;

  const financialInsights = await recursivePrompt(apiKey, financialPrompt, [], 3, 0);

  // Iteration 2: Statistical & Risk Analysis
  const statisticalPrompt = `As a quantitative analyst, perform deep statistical and risk analysis. Focus on:
1. Statistical significance of patterns
2. Risk-return profile assessment
3. Volatility analysis and implications
4. Drawdown risk assessment
5. Tail risk evaluation
6. Risk-adjusted return metrics interpretation

${dataContext}`;

  const statisticalInsights = await recursivePrompt(apiKey, statisticalPrompt, [], 3, 0);

  // Iteration 3: Trading Signals & Recommendations
  const tradingPrompt = `As a quantitative analyst, synthesize all analysis into actionable trading insights. Focus on:
1. Signal strength interpretation
2. Entry/exit timing
3. Risk management recommendations
4. Position sizing considerations
5. Stop-loss and take-profit levels
6. Time horizon recommendations

${dataContext}${newsContext}${sentimentContext}

Previous Analysis:
- Financial Insights: ${financialInsights.substring(0, 500)}...
- Statistical Insights: ${statisticalInsights.substring(0, 500)}...`;

  const tradingRecommendation = await recursivePrompt(apiKey, tradingPrompt, [financialInsights, statisticalInsights], 3, 0);

  // Iteration 4: Deep Dive Pattern Recognition
  const patternPrompt = `As a quantitative analyst, perform pattern recognition and correlation analysis. Focus on:
1. Price pattern identification
2. Volume-price relationships
3. Correlation with market indices (if applicable)
4. Seasonal patterns
5. Momentum indicators
6. Divergence analysis

${dataContext}`;

  const patternRecognition = await recursivePrompt(apiKey, patternPrompt, [], 2, 0);

  // Iteration 5: Predictive Insights
  const predictivePrompt = `As a quantitative analyst, provide predictive insights based on all available data. Focus on:
1. Short-term price direction (1-7 days)
2. Medium-term outlook (1-3 months)
3. Long-term prospects (6-12 months)
4. Key catalysts to watch
5. Potential risks and opportunities

${dataContext}${newsContext}${sentimentContext}

Synthesize all previous analysis:
- Financial: ${financialInsights.substring(0, 300)}...
- Statistical: ${statisticalInsights.substring(0, 300)}...
- Trading: ${tradingRecommendation.substring(0, 300)}...
- Patterns: ${patternRecognition.substring(0, 300)}...`;

  const predictiveInsights = await recursivePrompt(
    apiKey,
    predictivePrompt,
    [financialInsights, statisticalInsights, tradingRecommendation, patternRecognition],
    3,
    0
  );

  // Final Synthesis
  const finalPrompt = `As a senior quantitative analyst, provide a final comprehensive recommendation. Format your response as JSON:

{
  "financialInsights": "2-3 sentence summary of financial analysis",
  "statisticalInsights": "2-3 sentence summary of statistical findings",
  "riskAssessment": "Detailed risk assessment with specific concerns",
  "tradingRecommendation": "Actionable trading recommendation with reasoning",
  "marketOutlook": "Short, medium, and long-term market outlook",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4", "Finding 5"],
  "warnings": ["Warning 1", "Warning 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "threats": ["Threat 1", "Threat 2"],
  "patternRecognition": "Summary of identified patterns",
  "correlationAnalysis": "Key correlation insights",
  "predictiveInsights": "Price prediction and outlook",
  "alternativeDataInsights": "Any insights from alternative data sources",
  "finalRecommendation": {
    "action": "strong_buy|buy|hold|sell|strong_sell",
    "confidence": 0-100,
    "reasoning": "Detailed reasoning",
    "priceTarget": number or null,
    "stopLoss": number or null,
    "takeProfit": number or null,
    "timeHorizon": "short/medium/long term"
  }
}

${dataContext}${newsContext}${sentimentContext}

Previous comprehensive analysis:
${[financialInsights, statisticalInsights, tradingRecommendation, patternRecognition, predictiveInsights].join('\n\n---\n\n')}`;

  let finalAnalysis: any;
  try {
    const finalResponse = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: finalPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const text = finalResponse.data.candidates[0]?.content?.parts[0]?.text || '';
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    finalAnalysis = JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Error parsing final analysis:', error);
    // Fallback structured response
    finalAnalysis = {
      financialInsights: financialInsights.substring(0, 500),
      statisticalInsights: statisticalInsights.substring(0, 500),
      riskAssessment: statisticalInsights.substring(500, 1000),
      tradingRecommendation: tradingRecommendation.substring(0, 500),
      marketOutlook: predictiveInsights.substring(0, 500),
      keyFindings: ['Analysis completed', 'Multiple indicators reviewed'],
      warnings: quantAnalysis.riskMetrics.overallRiskScore > 70 ? ['High risk detected'] : [],
      opportunities: [],
      threats: [],
      patternRecognition: patternRecognition.substring(0, 500),
      correlationAnalysis: `Price-Volume Correlation: ${quantAnalysis.statisticalAnalysis.priceVolumeCorrelation.toFixed(3)}`,
      predictiveInsights: predictiveInsights.substring(0, 500),
      alternativeDataInsights: 'Alternative data analysis pending',
      finalRecommendation: {
        action: quantAnalysis.tradingSignals.buySignal ? 'buy' : 
                quantAnalysis.tradingSignals.sellSignal ? 'sell' : 'hold',
        confidence: quantAnalysis.tradingSignals.confidence,
        reasoning: tradingRecommendation.substring(0, 300),
        priceTarget: quantAnalysis.priceAnalysis.currentPrice * (1 + (quantAnalysis.tradingSignals.signalStrength / 100) * 0.1),
        stopLoss: quantAnalysis.patterns.supportLevels[0],
        takeProfit: quantAnalysis.patterns.resistanceLevels[0],
        timeHorizon: quantAnalysis.tradingSignals.timeHorizon,
      },
    };
  }

  return {
    initialAnalysis: quantAnalysis,
    aiEnhancedAnalysis: {
      financialInsights: finalAnalysis.financialInsights || financialInsights.substring(0, 500),
      statisticalInsights: finalAnalysis.statisticalInsights || statisticalInsights.substring(0, 500),
      riskAssessment: finalAnalysis.riskAssessment || 'Risk assessment completed',
      tradingRecommendation: finalAnalysis.tradingRecommendation || tradingRecommendation.substring(0, 500),
      marketOutlook: finalAnalysis.marketOutlook || predictiveInsights.substring(0, 500),
      keyFindings: finalAnalysis.keyFindings || ['Analysis completed'],
      warnings: finalAnalysis.warnings || [],
      opportunities: finalAnalysis.opportunities || [],
      threats: finalAnalysis.threats || [],
    },
    deepDiveAnalysis: {
      patternRecognition: finalAnalysis.patternRecognition || patternRecognition.substring(0, 500),
      correlationAnalysis: finalAnalysis.correlationAnalysis || 'Correlation analysis completed',
      predictiveInsights: finalAnalysis.predictiveInsights || predictiveInsights.substring(0, 500),
      alternativeDataInsights: finalAnalysis.alternativeDataInsights || 'Alternative data insights pending',
    },
    finalRecommendation: finalAnalysis.finalRecommendation || {
      action: quantAnalysis.tradingSignals.buySignal ? 'buy' : 
              quantAnalysis.tradingSignals.sellSignal ? 'sell' : 'hold',
      confidence: quantAnalysis.tradingSignals.confidence,
      reasoning: 'Based on quantitative analysis',
      timeHorizon: quantAnalysis.tradingSignals.timeHorizon,
    },
    iterationCount: 5,
    analysisDepth,
  };
}

