# Scalping Hunter

A high-performance real-time crypto scalping screener for Binance Futures. Built with SvelteKit, Elysia.js, and Capacitor.

## Features

### Scanning Modes
The screener runs three concurrent analysis modes to find setups in real-time:

1.  **Mode 1: Pump & Exhaustion**
    -   Detects rapid price pumps (Impulse).
    -   Looks for potential reversals using RSI exhaustion and Bollinger Band tightness.

2.  **Mode 2: Trend & Pullback**
    -   Identifies strong trends using EMA alignment (21 > 50).
    -   **ADX Filter**: Ensures trend strength (ADX > 20) to avoid chop.
    -   Signals entries on pullbacks to the 21 EMA.

3.  **Mode 3: Squeeze & Breakout**
    -   Detects volatility squeezes (low Bollinger Band width).
    -   **ATR Logic**: Validates breakouts based on Volatility (price move vs ATR) rather than just raw percentage.

### Technical Highlights
-   **Real-time WebSocket**: Direct connection to Binance Futures stream.
-   **Throttled Store**: Frontend state management uses a 500ms throttle to batch high-frequency updates, ensuring 60fps performance even with 300+ active tickers.
-   **Backend Proxy**: `api/binance.ts` (Elysia.js) proxies history scanning with in-memory caching (30s TTL) to respect rate limits.
-   **Cross-Platform**: Runs as a progressive web app (PWA) and a native Android app (via Capacitor).

## Tech Stack
-   **Frontend**: SvelteKit, TailwindCSS
-   **Backend**: Bun/Node (Elysia.js)
-   **Mobile**: Capacitor (Android)
-   **Build Tool**: Vite

## Setup

### Prerequisites
-   Node.js 20+
-   Bun (optional, for running scripts)
-   JDK 17+ / Android Studio (for mobile build)

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Web
```bash
# Build for Vercel/Static
npm run build
```

### Building for Android
```bash
# Sync Capacitor config
npx cap sync android

# Open Android Studio
npx cap open android
```

## Architecture
-   `src/lib/stores/market.ts`: Core state management. Handles WebSocket connections, data buffering (throttling), and indicator calculation.
-   `src/lib/scoring`: Logic for Mode 1, 2, and 3.
-   `src/lib/indicators`: Custom implementations of EMA, RSI, BB, ADX, ATR.
-   `api/binance.ts`: Server-side proxy for fetching historical klines.
