import { NextResponse } from 'next/server';
import { getStockQuote, getStockHistory } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const action = searchParams.get('action');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    if (action === 'history') {
      const history = await getStockHistory(symbol, 'daily');
      if (!history || history.length === 0) {
        return NextResponse.json(
          { error: 'No historical data available' },
          { status: 404 }
        );
      }
      return NextResponse.json(history);
    } else {
      const quote = await getStockQuote(symbol);
      if (!quote) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      return NextResponse.json(quote);
    }
  } catch (error: any) {
    console.error('Error fetching stock data:', error);
    const errorMessage = error?.message || 'Failed to fetch stock data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

