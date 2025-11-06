import { NextResponse } from 'next/server';
import { analyzeWithGemini } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, assetName, assetSymbol, currentPrice, priceChange, priceChangePercent, indicators, news, sentiment } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      );
    }

    if (!assetName || !assetSymbol || currentPrice === undefined) {
      return NextResponse.json(
        { error: 'Asset information is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeWithGemini(
      apiKey,
      assetName,
      assetSymbol,
      currentPrice,
      priceChange || 0,
      priceChangePercent || 0,
      indicators || {},
      news || [],
      sentiment || {}
    );

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}

