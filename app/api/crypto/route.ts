import { NextResponse } from 'next/server';
import { getCryptoById, getCryptoHistory } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');

  if (!id) {
    return NextResponse.json({ error: 'Crypto ID is required' }, { status: 400 });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}

