import { NextResponse } from 'next/server';
import { performQuantitativeAnalysis, PriceData } from '@/lib/quant-analysis';
import { performRecursiveQuantAnalysis } from '@/lib/gemini-quant';
import { getStockFinancials, getCryptoMetrics } from '@/lib/financial-data';
import { getStockHistory, getCryptoHistory } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      symbol,
      name,
      assetType,
      geminiApiKey,
      includeAI = true,
      historicalData,
    } = body;

    if (!symbol || !assetType) {
      return NextResponse.json(
        { error: 'Symbol and assetType are required' },
        { status: 400 }
      );
    }

    // Fetch historical data if not provided
    let priceData: PriceData[] = historicalData || [];
    
    if (priceData.length === 0) {
      if (assetType === 'stock') {
        const history = await getStockHistory(symbol, 'daily');
        priceData = history.map(h => ({
          date: h.date,
          price: h.price,
          volume: h.volume,
        }));
      } else {
        // For crypto, symbol is the CoinGecko ID
        try {
          const history = await getCryptoHistory(symbol, 90);
          priceData = history.map(h => ({
            date: h.date,
            price: h.price,
            volume: h.volume,
          }));
        } catch (error) {
          console.error('Error fetching crypto history:', error);
          // Try with symbol as fallback
          try {
            const history = await getCryptoHistory(symbol.toLowerCase(), 90);
            priceData = history.map(h => ({
              date: h.date,
              price: h.price,
              volume: h.volume,
            }));
          } catch (e) {
            console.error('Fallback crypto history fetch failed:', e);
          }
        }
      }
    }

    if (priceData.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient historical data for analysis' },
        { status: 400 }
      );
    }

    // Fetch financial metrics (gracefully handle failures)
    let financialMetrics;
    try {
      if (assetType === 'stock') {
        financialMetrics = await getStockFinancials(symbol);
      } else {
        const cryptoMetrics = await getCryptoMetrics(symbol);
        financialMetrics = {
          marketCap: cryptoMetrics.marketCap,
        };
      }
    } catch (error: any) {
      console.warn('Failed to fetch financial metrics, continuing with analysis:', error.message);
      financialMetrics = {}; // Continue analysis without financial metrics
    }

    // Perform quantitative analysis
    const quantAnalysis = performQuantitativeAnalysis(
      priceData,
      financialMetrics,
      assetType
    );

    // Update symbol and name
    quantAnalysis.symbol = symbol;
    quantAnalysis.name = name || symbol;

    // Perform AI-enhanced recursive analysis if requested
    if (includeAI && geminiApiKey) {
      try {
        const aiAnalysis = await performRecursiveQuantAnalysis(
          geminiApiKey,
          quantAnalysis,
          financialMetrics,
          body.newsData,
          body.sentimentData,
          priceData
        );

        return NextResponse.json({
          success: true,
          quantAnalysis,
          aiAnalysis,
        });
      } catch (aiError: any) {
        console.error('AI analysis error:', aiError);
        // Return quantitative analysis even if AI fails
        return NextResponse.json({
          success: true,
          quantAnalysis,
          aiError: aiError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      quantAnalysis,
    });
  } catch (error: any) {
    console.error('Error in quant analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform quantitative analysis' },
      { status: 500 }
    );
  }
}

