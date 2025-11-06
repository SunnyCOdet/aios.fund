import axios from 'axios';

export interface GeminiAnalysis {
  summary: string;
  keyPoints: string[];
  riskAssessment: string;
  marketOutlook: string;
  recommendation: string;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function analyzeWithGemini(
  apiKey: string,
  assetName: string,
  assetSymbol: string,
  currentPrice: number,
  priceChange: number,
  priceChangePercent: number,
  indicators: any,
  news: any[],
  sentiment: any
): Promise<GeminiAnalysis> {
  try {
    const prompt = `As a financial analyst, provide a comprehensive analysis of ${assetName} (${assetSymbol}).

Current Data:
- Current Price: $${currentPrice.toFixed(2)}
- 24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)

Technical Indicators:
- RSI: ${indicators.rsi.toFixed(2)} ${indicators.rsi > 70 ? '(Overbought)' : indicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
- MACD: ${indicators.macd.value.toFixed(4)}
- Trend: ${indicators.trend}
- Bollinger Bands: Upper: $${indicators.bollinger.upper.toFixed(2)}, Middle: $${indicators.bollinger.middle.toFixed(2)}, Lower: $${indicators.bollinger.lower.toFixed(2)}
- Stochastic: K=${indicators.stochastic.k.toFixed(2)}, D=${indicators.stochastic.d.toFixed(2)}
- ADX: ${indicators.adx.toFixed(2)} ${indicators.adx > 25 ? '(Strong Trend)' : '(Weak Trend)'}

Market Sentiment:
- News Sentiment: ${sentiment.overall} (${sentiment.positive.toFixed(1)}% positive, ${sentiment.negative.toFixed(1)}% negative)

Recent News Articles (Full Content):
${news.slice(0, 5).map((n: any, idx: number) => 
  `Article ${idx + 1}: ${n.title}\n${n.fullContent || n.description || 'Content not available'}\n---`
).join('\n\n')}

Please provide:
1. A brief summary (2-3 sentences)
2. Key technical and fundamental points (3-5 bullet points)
3. Risk assessment (1-2 sentences)
4. Short-term market outlook (1-2 sentences)
5. Trading recommendation (buy/hold/sell with brief reasoning)

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "riskAssessment": "...",
  "marketOutlook": "...",
  "recommendation": "..."
}`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    
    // Helper function to remove markdown formatting
    const cleanMarkdown = (str: string): string => {
      if (!str) return '';
      return str
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italics markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .trim();
    };
    
    // Try to parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonText);
      
      // Clean markdown from all string fields
      return {
        summary: cleanMarkdown(parsed.summary || ''),
        keyPoints: (parsed.keyPoints || []).map((point: string) => cleanMarkdown(point)),
        riskAssessment: cleanMarkdown(parsed.riskAssessment || ''),
        marketOutlook: cleanMarkdown(parsed.marketOutlook || ''),
        recommendation: cleanMarkdown(parsed.recommendation || ''),
      };
    } catch {
      // If JSON parsing fails, create structured response from text
      const cleanedText = cleanMarkdown(text);
      const lines = cleanedText.split('\n').filter(l => l.trim() && !l.match(/^[-*•]\s*$/)); // Filter empty bullet points
      
      return {
        summary: cleanMarkdown(lines[0] || 'Analysis generated successfully.'),
        keyPoints: lines
          .filter((l, i) => i > 0 && i < 6 && l.trim().length > 0 && !l.match(/^(summary|key|risk|outlook|recommendation)/i))
          .map(l => cleanMarkdown(l.replace(/^[-*•]\s*/, ''))), // Remove bullet points
        riskAssessment: cleanMarkdown(
          lines.find(l => l.toLowerCase().includes('risk')) || 
          'Moderate risk based on current market conditions.'
        ),
        marketOutlook: cleanMarkdown(
          lines.find(l => l.toLowerCase().includes('outlook') || l.toLowerCase().includes('forecast')) || 
          'Market showing mixed signals.'
        ),
        recommendation: cleanMarkdown(
          lines.find(l => l.toLowerCase().includes('recommend') || l.toLowerCase().includes('buy') || l.toLowerCase().includes('sell')) || 
          'Hold position and monitor indicators.'
        ),
      };
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to analyze with Gemini AI');
  }
}

