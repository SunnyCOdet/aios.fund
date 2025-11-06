# 🚀 Next Level Trading

A beautiful, fun, and easy-to-use trading and crypto investment platform with AI-powered predictions and technical analysis.

## ✨ Features

- 📊 **Real-time Crypto Data** - Track top cryptocurrencies with live prices, market cap, and 24h changes
- 📈 **Stock Market Integration** - Search and analyze stocks using Alpha Vantage API
- 🤖 **AI-Powered Predictions** - Get buy/sell/hold recommendations based on technical indicators
- 📉 **Technical Analysis** - RSI, MACD, Moving Averages (SMA 20/50/200), and trend analysis
- 📱 **Beautiful Charts** - Interactive price charts with historical data
- ⭐ **Watchlist** - Save your favorite assets for quick access
- 💼 **Portfolio Tracking** - Track your holdings with real-time profit/loss calculations
- 🔔 **Price Alerts** - Set price alerts and get notified when targets are hit
- 💬 **Social Sentiment Analysis** - Analyze Reddit posts to gauge market sentiment
- 🎨 **Modern UI** - Glassmorphism design with smooth animations

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful chart components
- **CoinGecko API** - Free cryptocurrency data (no API key needed)
- **Alpha Vantage API** - Stock market data (free tier available)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get a free Alpha Vantage API key (optional for stocks):**
   - Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Sign up for a free API key
   - Update `lib/api.ts` and replace `ALPHA_VANTAGE_KEY` with your key:
   ```typescript
   const ALPHA_VANTAGE_KEY = 'your-api-key-here';
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Cryptocurrencies
1. Browse the top cryptocurrencies on the main dashboard
2. Search for specific coins using the search bar
3. Click on any crypto card to see detailed predictions and technical analysis
4. Add favorites to your watchlist by clicking the star icon

### Stocks
1. Use the Stock Search panel in the sidebar
2. Enter a stock symbol (e.g., AAPL, MSFT, TSLA)
3. Click "Search" or use the quick buttons for popular stocks
4. View real-time stock data and predictions

### Portfolio Tracking
1. Click the "+" button in the Portfolio panel
2. Select asset type (Crypto or Stock)
3. Enter symbol, name, quantity, and purchase price
4. View real-time profit/loss calculations
5. Prices update automatically every 30 seconds

### Price Alerts
1. Click the "+" button in the Price Alerts panel
2. Select asset type and enter symbol/name
3. Set condition (Above/Below) and target price
4. Get notified when price hits your target
5. Allow browser notifications for best experience

### Social Sentiment Analysis
1. Click on any crypto or stock card to view detailed analysis
2. Scroll down to see the Social Sentiment panel in the sidebar
3. View overall sentiment (positive/negative) based on Reddit posts
4. Browse recent social media posts with sentiment labels
5. Click on any post to view it on Reddit
6. Posts are sorted by engagement (upvotes and comments)

### Understanding Predictions

The app uses multiple technical indicators to generate predictions:

- **RSI (Relative Strength Index)**: Measures overbought/oversold conditions
  - RSI > 70: Overbought (potential sell signal)
  - RSI < 30: Oversold (potential buy signal)

- **MACD (Moving Average Convergence Divergence)**: Shows momentum
  - Positive histogram: Bullish momentum
  - Negative histogram: Bearish momentum

- **Moving Averages**: Identify trends
  - Price above all SMAs: Strong uptrend
  - Price below all SMAs: Strong downtrend

- **Recommendations**:
  - **BUY**: Multiple bullish signals detected
  - **SELL**: Multiple bearish signals detected
  - **HOLD**: Mixed or neutral signals

## 🔑 API Keys

### CoinGecko (Cryptocurrencies)
- **Status**: Free, no API key required ✅
- **Rate Limit**: 10-50 calls/minute (varies by plan)

### Alpha Vantage (Stocks)
- **Status**: Free tier available (requires API key)
- **Rate Limit**: 5 calls/minute, 500 calls/day
- **Get your key**: [Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key)

## 📁 Project Structure

```
next-level/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── Dashboard.tsx        # Main dashboard
│   ├── CryptoCard.tsx       # Crypto card component
│   ├── StockCard.tsx        # Stock card component
│   ├── PredictionPanel.tsx # Prediction analysis panel
│   ├── PriceChart.tsx       # Price chart component
│   ├── Watchlist.tsx        # Watchlist component
│   ├── StockSearch.tsx      # Stock search component
│   └── LoadingSpinner.tsx   # Loading spinner
├── lib/
│   ├── api.ts               # API integration functions
│   └── indicators.ts        # Technical indicator calculations
└── package.json
```

## 🎯 Future Enhancements

- [x] Portfolio tracking with profit/loss calculations ✅
- [x] Price alerts and notifications ✅
- [ ] More advanced technical indicators
- [x] Social sentiment analysis ✅
- [x] News integration for market context ✅
- [ ] Mobile app using Expo
- [ ] Backtesting capabilities
- [ ] Paper trading simulator

## ⚠️ Disclaimer

This app is for educational and informational purposes only. It is not financial advice. Always do your own research and consult with a financial advisor before making investment decisions. Past performance does not guarantee future results.

## 📝 License

MIT License - feel free to use this project for learning and building your own trading tools!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

**Made with ❤️ for traders and crypto enthusiasts**

Enjoy predicting and analyzing the markets! 🚀📈

