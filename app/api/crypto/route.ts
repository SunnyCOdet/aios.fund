import { NextResponse } from 'next/server';
import { getTopCryptos, searchCryptos, getCryptoById, getCryptoHistory } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  const query = searchParams.get('query');
  const limit = searchParams.get('limit');

  try {
    // Handle top cryptos request
    if (action === 'top' || (!id && !query && !action)) {
      const limitNum = limit ? parseInt(limit) : 20;
      const data = await getTopCryptos(limitNum);
      return NextResponse.json(data);
    }

    // Handle search request
    if (query) {
      const results = await searchCryptos(query);
      return NextResponse.json(results);
    }

    // Handle individual crypto by ID
    if (id) {
      if (action === 'history') {
        const days = parseInt(searchParams.get('days') || '30');
        const history = await getCryptoHistory(id, days);
        return NextResponse.json(history);
      } else {
        const crypto = await getCryptoById(id);
        if (!crypto) {
          return NextResponse.json({ error: 'Crypto not found' }, { status: 404 });
        }
        return NextResponse.json(crypto);
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}

