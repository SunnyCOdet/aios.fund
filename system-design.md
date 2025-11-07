# System Design Overview

This document captures the end-to-end architecture for the **Next-Level Market Intelligence Platform**. The product is a Next.js application that aggregates multi-asset market data, performs quantitative analysis (classical + AI-assisted), and surfaces insights through a rich dashboard UI.

---

## High-Level Architecture

```
┌────────────────────────┐
│        Browser         │
│  (Next.js React UI)    │
└──────────┬─────────────┘
           │ HTTP (fetch)
           ▼
┌────────────────────────┐      ┌──────────────────────────────┐
│  Next.js App Router    │─────▶│  /api/* Route Handlers        │
│  (app/ directory)      │◀─────│  (Edge/server runtime)       │
└────────────────────────┘      └────┬───────────────┬─────────┘
                                      │               │
                                      │               │
                           ┌──────────▼────────┐ ┌────▼───────────┐
                           │ lib/api.ts etc.   │ │ Integrations   │
                           │ Data Fetch Layer  │ │ (3rd Parties)  │
                           └─────────┬─────────┘ └────────┬───────┘
                                      │                     │
                           ┌──────────▼────────┐  ┌────────▼────────┐
                           │ Quant + AI Engine │  │  Market & News  │
                           │ lib/quant-*.ts    │  │  APIs           │
                           └───────────────────┘  └──────────────────┘
```

---

## Key Subsystems

### 1. Presentation Layer (Next.js Client Components)
- **Dashboard (`components/Dashboard.tsx`)** orchestrates state for crypto/stock lists, search filters, and selected assets.
- **Cards & Panels** (`CryptoCard`, `StockCard`, `PredictionPanel`, `QuantAnalysisPanel`, `SentimentPanel`, `Portfolio`, `PriceAlerts`, `Watchlist`) render domain-specific views.
- **StockSearch** client component triggers API calls via `fetch('/api/...')`, ensuring compatibility with exchange APIs without CORS issues.

### 2. API Layer (Next.js Route Handlers)
- Located under `app/api/*/route.ts` and executed on the server.
- Responsibilities:
  - **`/api/stocks`**: Fetches real-time quotes and historical data using `lib/api.ts` (which now prioritises exchange-native APIs like NSE/BSE/LSE/TSE/TSX/ASX before falling back to Yahoo Finance and Alpha Vantage).
  - **`/api/crypto`**: Proxy to CoinGecko for search, listings, and price history.
  - **`/api/quant-analysis`**: Orchestrates quantitative analytics, calling into `lib/quant-analysis.ts` and optionally `lib/gemini-quant.ts` for AI-enhanced insights when a Gemini API key is provided.
  - **`/api/news`, `/api/sentiment`, `/api/scrape-article`**: Aggregate news articles and sentiment from multiple sources (news APIs, social media, etc.).
  - **`/api/ai`**: Handles general-purpose AI interactions (Gemini / custom prompts) as needed.

All route handlers respond with JSON, use server-side `fetch`/`axios` for third-party calls, and centralise error handling to provide user-friendly messages.

### 3. Data Fetch & Integration (`lib` directory)
- **`lib/api.ts`**: Shared data-access layer. Key responsibilities:
  - Determines best data source for a symbol (exchange APIs → Yahoo Finance → Alpha Vantage).
  - Normalises responses into `StockData`, `CryptoData`, and `HistoricalData` interfaces.
  - Exposes helper utilities for top cryptos, search, quotes, history, etc.
- **`lib/exchange-apis.ts`**: Implements direct exchange integrations (NSE, BSE, LSE, TSE, TSX, ASX). Each fetcher handles custom headers, JSON formats, and currency mapping.
- **`lib/financial-data.ts`**: Pulls deeper fundamentals/metrics, primarily from Yahoo Finance and Alpha Vantage, with graceful degradation when rate limits hit.
- **`lib/news.ts`, `lib/news-agent.ts`**: Manage news aggregation, deduplication, and summarisation.
- **`lib/currency.ts`**: Centralised currency symbol + formatting helpers now reused across stock and crypto views.

### 4. Quantitative & AI Analysis
- **`lib/quant-analysis.ts`**: Performs classical quant analytics (statistics, risk metrics, signals). Consumed by `/api/quant-analysis`.
- **`lib/gemini-quant.ts`**: Implements recursive prompting loops with Google Gemini for deeper analysis, predictions, and recommendations.
- **`components/QuantAnalysisPanel.tsx`**: Visualises quant + AI results; uses `formatCurrency` to respect asset currency (USD, INR, GBP, etc.).

### 5. State Management & Persistence
- Primarily managed client-side via React state hooks within components.
- API keys (e.g., Gemini) are stored in `localStorage` (client) and read on demand.
- Watchlists/portfolio data currently live in client state; extension paths include hooking into Supabase/Firebase or local DB.

---

## Data Flow Scenarios

### A. Stock Quote Retrieval
1. User enters symbol in `StockSearch` (e.g., `RELIANCE.NS`).
2. Client calls `/api/stocks?symbol=RELIANCE.NS`.
3. Route handler invokes `getStockQuote`:
   - `lib/exchange-apis.ts` attempts NSE API → fallback to Yahoo Finance → fallback to Alpha Vantage.
   - Response includes price, change, volume, currency (`INR`).
4. API returns JSON; client updates UI and triggers downstream panels.

### B. Quantitative Analysis with AI
1. User selects a stock card → Dashboard sets `selectedAsset`.
2. `QuantAnalysisPanel` invokes `/api/quant-analysis` with symbol, name, and optional Gemini key.
3. Server fetches historical OHLCV data via `lib/api.ts` and fundamentals via `lib/financial-data.ts`.
4. `lib/quant-analysis.ts` calculates statistics, risk metrics, and trading signals.
5. If Gemini key provided, `lib/gemini-quant.ts` performs iterative prompt loops to produce AI-enhanced insights.
6. Combined response rendered in tabs (Overview, Financial, Statistical, Risk, Signals, AI).

### C. News & Sentiment Pipeline
1. On asset selection, Dashboard fetches `/api/news` and `/api/sentiment`.
2. Routes aggregate multiple upstream services (news APIs, social feeds).
3. Results displayed in `PredictionPanel`, `SentimentPanel`, and other UI components.

---

## External Integrations

| Service / API          | Usage                                    | Notes |
|------------------------|-------------------------------------------|-------|
| **NSE/BSE/LSE/TSE/TSX/ASX** | Direct exchange quotes (priority source) | Requires custom headers, fallback strategy |
| **Yahoo Finance**      | Quote & historical fallback, fundamentals | No API key required; uses chart endpoint |
| **Alpha Vantage**      | Final fallback for quotes/history         | Rate-limited; `demo` key supported |
| **CoinGecko**          | Crypto listings, quotes, history          | Free tier used via `lib/api.ts` |
| **Google Gemini**      | Recursive AI-driven quant analysis        | Requires user-provided API key |
| **News APIs / Social** | Market news, sentiment                    | Aggregated through `/api/news` & `/api/sentiment` |

---

## Deployment & Runtime Considerations

- **Hosting**: Next.js app can run on Vercel or any Node environment supporting the App Router. Exchange APIs requiring custom headers may need a server runtime (not purely edge).
- **Environment Variables**: `NEXT_PUBLIC_ALPHA_VANTAGE_KEY`, `GEMINI_API_KEY`, and future credentials should be managed via `.env.local`.
- **Caching**: Heavy API calls (e.g., quant analysis, news) can benefit from ISR or server-side caching if latency becomes an issue.
- **Rate Limits & Retries**: Exchange and fallback APIs implement retry/fallback logic. Production deployments should include rate-limit monitors.
- **Security**: Ensure API keys never leak to the client, except user-managed keys (Gemini) deliberately stored client-side. Consider proxying sensitive calls server-side.

---

## Future Enhancements

- Persist user portfolios/watchlists to a database with authentication.
- Introduce background jobs for scheduled data refreshes and alerting (e.g., using cron + queue).
- Add WebSocket layer for streaming prices once exchange policies permit.
- Expand exchange coverage and add ETF/commodity integration.
- Implement feature flags and telemetry dashboards for usage monitoring.

---

## Change Log

- **2025-11-07**: Initial version documenting current architecture, data flows, and integrations after introducing direct exchange APIs and currency-aware UI formatting.


