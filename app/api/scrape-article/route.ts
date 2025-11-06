import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || url === '#') {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Direct fetch and parse (server-side, no CORS issues)
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400,
      });

      const htmlContent = response.data;

      // Extract article content using multiple strategies
      let extractedText = '';

      // Strategy 1: Look for <article> tag
      const articleMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        extractedText = articleMatch[1];
      } else {
        // Strategy 2: Look for <main> tag
        const mainMatch = htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) {
          extractedText = mainMatch[1];
        } else {
          // Strategy 3: Look for common article class names
          const classMatch = htmlContent.match(/<div[^>]*class="[^"]*(?:article|content|post|story)[^"]*"[^>]*>([\s\S]{0,10000}?)<\/div>/i);
          if (classMatch) {
            extractedText = classMatch[1];
          } else {
            // Strategy 4: Extract body content
            const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              extractedText = bodyMatch[1];
            } else {
              extractedText = htmlContent;
            }
          }
        }
      }

      // Clean the extracted content
      const cleanedText = extractedText
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove navigation
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove headers
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footers
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '') // Remove sidebars
        .replace(/<[^>]+>/g, ' ') // Remove remaining HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Extract title
      const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
                        htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                        htmlContent.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // Limit content length (keep first 8000 chars for AI context)
      const limitedContent = cleanedText.substring(0, 8000);

      if (!limitedContent || limitedContent.length < 50) {
        return NextResponse.json(
          { error: 'Could not extract meaningful content from article' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        content: limitedContent,
        title: title,
        excerpt: limitedContent.substring(0, 300),
      });
    } catch (fetchError: any) {
      console.error('Error fetching article:', fetchError.message);
      return NextResponse.json(
        { error: 'Failed to fetch article content. The URL may be inaccessible or blocked.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in article scraping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape article' },
      { status: 500 }
    );
  }
}

