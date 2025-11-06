'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Activity, Shield, Target } from 'lucide-react';

// Helper function to safely render values that might be objects
function renderValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    // If it's an object with shortTerm, mediumTerm, longTerm, format it nicely
    if (value.shortTerm || value.mediumTerm || value.longTerm) {
      const parts: string[] = [];
      if (value.shortTerm) parts.push(`Short-term: ${value.shortTerm}`);
      if (value.mediumTerm) parts.push(`Medium-term: ${value.mediumTerm}`);
      if (value.longTerm) parts.push(`Long-term: ${value.longTerm}`);
      return parts.join('. ');
    }
    // Otherwise, try to stringify it
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

interface QuantAnalysisPanelProps {
  symbol: string;
  name: string;
  assetType: 'stock' | 'crypto';
  geminiApiKey?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export default function QuantAnalysisPanel({
  symbol,
  name,
  assetType,
  geminiApiKey,
  onAnalysisComplete,
}: QuantAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'statistical' | 'risk' | 'signals' | 'ai'>('overview');

  useEffect(() => {
    if (symbol) {
      performAnalysis();
    }
  }, [symbol, geminiApiKey]);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quant-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name,
          assetType,
          geminiApiKey,
          includeAI: !!geminiApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to perform quantitative analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-white">Performing comprehensive quantitative analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={performAnalysis}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const quant = analysis.quantAnalysis;
  const ai = analysis.aiAnalysis;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'statistical', label: 'Statistical', icon: Activity },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'signals', label: 'Signals', icon: Target },
    ...(ai ? [{ id: 'ai', label: 'AI Analysis', icon: CheckCircle }] : []),
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <h2 className="text-2xl font-bold text-white mb-2">Quantitative Analysis</h2>
        <p className="text-gray-300 text-sm">{symbol} - {name}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/20 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab quant={quant} ai={ai} />}
        {activeTab === 'financial' && <FinancialTab quant={quant} />}
        {activeTab === 'statistical' && <StatisticalTab quant={quant} />}
        {activeTab === 'risk' && <RiskTab quant={quant} />}
        {activeTab === 'signals' && <SignalsTab quant={quant} ai={ai} />}
        {activeTab === 'ai' && ai && <AITab ai={ai} />}
      </div>
    </div>
  );
}

function OverviewTab({ quant, ai }: any) {
  const signalColor = quant.tradingSignals.signalStrength > 30 ? 'text-green-400' :
                      quant.tradingSignals.signalStrength < -30 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Signal Strength"
          value={`${quant.tradingSignals.signalStrength.toFixed(1)}/100`}
          color={signalColor}
          icon={TrendingUp}
        />
        <MetricCard
          label="Risk Score"
          value={`${quant.riskMetrics.overallRiskScore.toFixed(1)}/100`}
          color={quant.riskMetrics.overallRiskScore > 70 ? 'text-red-400' : 'text-green-400'}
          icon={Shield}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={quant.riskMetrics.sharpeRatio.toFixed(2)}
          color={quant.riskMetrics.sharpeRatio > 1 ? 'text-green-400' : 'text-yellow-400'}
          icon={BarChart3}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${(quant.riskMetrics.maxDrawdown * 100).toFixed(2)}%`}
          color={quant.riskMetrics.maxDrawdown > 0.3 ? 'text-red-400' : 'text-green-400'}
          icon={TrendingDown}
        />
      </div>

      {/* Price Analysis */}
      <div className="bg-white/5 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Price Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">24h Change</p>
            <p className={`text-lg font-bold ${quant.priceAnalysis.priceChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {quant.priceAnalysis.priceChangePercent24h >= 0 ? '+' : ''}
              {quant.priceAnalysis.priceChangePercent24h.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">7d Change</p>
            <p className={`text-lg font-bold ${quant.priceAnalysis.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {quant.priceAnalysis.priceChange7d >= 0 ? '+' : ''}
              {quant.priceAnalysis.priceChange7d.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">30d Change</p>
            <p className={`text-lg font-bold ${quant.priceAnalysis.priceChange30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {quant.priceAnalysis.priceChange30d >= 0 ? '+' : ''}
              {quant.priceAnalysis.priceChange30d.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {ai && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            AI-Enhanced Analysis
          </h3>
          <p className="text-gray-200 text-sm mb-3">{renderValue(ai.aiEnhancedAnalysis.marketOutlook)}</p>
          {ai.finalRecommendation && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Recommendation:</span>{' '}
                <span className={`font-bold ${
                  ai.finalRecommendation.action === 'strong_buy' || ai.finalRecommendation.action === 'buy' ? 'text-green-400' :
                  ai.finalRecommendation.action === 'strong_sell' || ai.finalRecommendation.action === 'sell' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {ai.finalRecommendation.action.replace('_', ' ').toUpperCase()}
                </span>
                {' '}({ai.finalRecommendation.confidence}% confidence)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FinancialTab({ quant }: any) {
  const metrics = quant.financialMetrics;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Financial Metrics</h3>
      
      {Object.keys(metrics).length === 0 ? (
        <p className="text-gray-400">Financial metrics not available for this asset.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {metrics.peRatio !== undefined && (
            <MetricItem label="P/E Ratio" value={metrics.peRatio.toFixed(2)} />
          )}
          {metrics.eps !== undefined && (
            <MetricItem label="EPS" value={`$${metrics.eps.toFixed(2)}`} />
          )}
          {metrics.profitMargin !== undefined && (
            <MetricItem label="Profit Margin" value={`${(metrics.profitMargin * 100).toFixed(2)}%`} />
          )}
          {metrics.revenueGrowth !== undefined && (
            <MetricItem label="Revenue Growth" value={`${(metrics.revenueGrowth * 100).toFixed(2)}%`} />
          )}
          {metrics.roa !== undefined && (
            <MetricItem label="ROA" value={`${(metrics.roa * 100).toFixed(2)}%`} />
          )}
          {metrics.roe !== undefined && (
            <MetricItem label="ROE" value={`${(metrics.roe * 100).toFixed(2)}%`} />
          )}
          {metrics.debtToEquity !== undefined && (
            <MetricItem label="Debt-to-Equity" value={metrics.debtToEquity.toFixed(2)} />
          )}
          {metrics.marketCap !== undefined && (
            <MetricItem label="Market Cap" value={`$${(metrics.marketCap / 1e9).toFixed(2)}B`} />
          )}
        </div>
      )}
    </div>
  );
}

function StatisticalTab({ quant }: any) {
  const stats = quant.statisticalAnalysis;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Statistical Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <MetricItem label="Mean Price" value={`$${stats.mean.toFixed(2)}`} />
        <MetricItem label="Median Price" value={`$${stats.median.toFixed(2)}`} />
        <MetricItem label="Std Deviation" value={`$${stats.stdDev.toFixed(2)}`} />
        <MetricItem label="Volatility (Annual)" value={`${(stats.annualizedVolatility * 100).toFixed(2)}%`} />
        <MetricItem label="Skewness" value={stats.skewness.toFixed(3)} />
        <MetricItem label="Kurtosis" value={stats.kurtosis.toFixed(3)} />
        <MetricItem label="Price-Volume Correlation" value={stats.priceVolumeCorrelation.toFixed(3)} />
        <MetricItem label="R² (Linear Regression)" value={stats.linearRegression.rSquared.toFixed(3)} />
        <MetricItem label="Trend Strength" value={stats.trendStrength.toFixed(3)} />
        <MetricItem label="Distribution Type" value={stats.distributionType} />
      </div>
    </div>
  );
}

function RiskTab({ quant }: any) {
  const risk = quant.riskMetrics;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
      
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Overall Risk Score</span>
          <span className={`text-2xl font-bold ${
            risk.overallRiskScore > 70 ? 'text-red-400' :
            risk.overallRiskScore > 40 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {risk.overallRiskScore.toFixed(1)}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              risk.overallRiskScore > 70 ? 'bg-red-500' :
              risk.overallRiskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${risk.overallRiskScore}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricItem label="Sharpe Ratio" value={risk.sharpeRatio.toFixed(3)} />
        <MetricItem label="Sortino Ratio" value={risk.sortinoRatio.toFixed(3)} />
        <MetricItem label="Calmar Ratio" value={risk.calmarRatio.toFixed(3)} />
        <MetricItem label="Max Drawdown" value={`${(risk.maxDrawdown * 100).toFixed(2)}%`} />
        <MetricItem label="Current Drawdown" value={`${(risk.currentDrawdown * 100).toFixed(2)}%`} />
        <MetricItem label="VaR (95%)" value={`${(risk.var95 * 100).toFixed(2)}%`} />
        <MetricItem label="VaR (99%)" value={`${(risk.var99 * 100).toFixed(2)}%`} />
        <MetricItem label="CVaR (95%)" value={`${(risk.cvar95 * 100).toFixed(2)}%`} />
        <MetricItem label="Downside Deviation" value={`${(risk.downsideDeviation * 100).toFixed(2)}%`} />
        <MetricItem label="Tail Ratio" value={risk.tailRatio.toFixed(3)} />
      </div>
    </div>
  );
}

function SignalsTab({ quant, ai }: any) {
  const signals = quant.tradingSignals;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
      
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-300">Signal Strength</span>
          <span className={`text-2xl font-bold ${
            signals.signalStrength > 30 ? 'text-green-400' :
            signals.signalStrength < -30 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {signals.signalStrength.toFixed(1)}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              signals.signalStrength > 30 ? 'bg-green-500' :
              signals.signalStrength < -30 ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.abs(signals.signalStrength)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricItem label="Technical Signal" value={`${signals.technicalSignal.toFixed(1)}/100`} />
        <MetricItem label="Fundamental Signal" value={`${signals.fundamentalSignal.toFixed(1)}/100`} />
        <MetricItem label="Confidence" value={`${signals.confidence.toFixed(1)}%`} />
        <MetricItem label="Time Horizon" value={renderValue(signals.timeHorizon)} />
      </div>

      <div className="mt-4">
        <div className={`p-3 rounded-lg ${
          signals.buySignal ? 'bg-green-500/20 border border-green-500/50' :
          signals.sellSignal ? 'bg-red-500/20 border border-red-500/50' :
          'bg-yellow-500/20 border border-yellow-500/50'
        }`}>
          <p className="font-semibold text-white">
            {signals.buySignal ? '🟢 BUY Signal' : signals.sellSignal ? '🔴 SELL Signal' : '🟡 HOLD Signal'}
          </p>
        </div>
      </div>

      {ai?.finalRecommendation && (
        <div className="mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
          <h4 className="font-semibold text-white mb-2">AI Recommendation</h4>
          <p className="text-sm text-gray-200 mb-2">{renderValue(ai.finalRecommendation.reasoning)}</p>
          {ai.finalRecommendation.priceTarget && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Target:</span>
                <span className="text-green-400 font-bold ml-1">${ai.finalRecommendation.priceTarget.toFixed(2)}</span>
              </div>
              {ai.finalRecommendation.stopLoss && (
                <div>
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-red-400 font-bold ml-1">${ai.finalRecommendation.stopLoss.toFixed(2)}</span>
                </div>
              )}
              {ai.finalRecommendation.takeProfit && (
                <div>
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="text-green-400 font-bold ml-1">${ai.finalRecommendation.takeProfit.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AITab({ ai }: any) {
  if (!ai) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">AI-Enhanced Analysis</h3>
        <p className="text-gray-200 text-sm mb-4">{renderValue(ai.aiEnhancedAnalysis.marketOutlook)}</p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Financial Insights</h4>
        <p className="text-gray-300 text-sm">{renderValue(ai.aiEnhancedAnalysis.financialInsights)}</p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Statistical Insights</h4>
        <p className="text-gray-300 text-sm">{renderValue(ai.aiEnhancedAnalysis.statisticalInsights)}</p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Risk Assessment</h4>
        <p className="text-gray-300 text-sm">{renderValue(ai.aiEnhancedAnalysis.riskAssessment)}</p>
      </div>

      {ai.aiEnhancedAnalysis.keyFindings && ai.aiEnhancedAnalysis.keyFindings.length > 0 && (
        <div>
          <h4 className="font-semibold text-white mb-2">Key Findings</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            {ai.aiEnhancedAnalysis.keyFindings.map((finding: string, i: number) => (
              <li key={i}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.aiEnhancedAnalysis.warnings && ai.aiEnhancedAnalysis.warnings.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warnings
          </h4>
          <ul className="list-disc list-inside space-y-1 text-red-300 text-sm">
            {ai.aiEnhancedAnalysis.warnings.map((warning: string, i: number) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.deepDiveAnalysis && (
        <div>
          <h4 className="font-semibold text-white mb-2">Deep Dive Analysis</h4>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Pattern Recognition:</p>
              <p className="text-gray-300">{renderValue(ai.deepDiveAnalysis.patternRecognition)}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Correlation Analysis:</p>
              <p className="text-gray-300">{renderValue(ai.deepDiveAnalysis.correlationAnalysis)}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Predictive Insights:</p>
              <p className="text-gray-300">{renderValue(ai.deepDiveAnalysis.predictiveInsights)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

