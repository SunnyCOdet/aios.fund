import { NextResponse } from 'next/server';
import { getMarketNews, analyzeNewsSentiment } from '@/lib/news';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const articles = await getMarketNews(query, limit);
    const sentiment = analyzeNewsSentiment(articles);

    return NextResponse.json({
      articles,
      sentiment,
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

