export interface Ticker {
    s: string;  // Symbol
    c: string;  // Close price
    p: string;  // Price change
    P: string;  // Price change percent
    q: string;  // Quote volume
}

export interface Kline {
    t: number;  // Open time
    o: number;  // Open
    h: number;  // High
    l: number;  // Low
    c: number;  // Close
    v: number;  // Volume
}

export interface MarketState {
    symbol: string;
    price: number;
    change24h: number;
    volume: number;

    // Technicals
    rsi5m?: number;
    rsi1m?: number;
    rsi15m?: number; // Intraday
    rsi1h?: number; // Intraday
    adx1m?: number; // Trend Strength
    atr5m?: number; // Volatility Context

    // MTF Indicators for Mode 2
    ema50_15m?: number; // Major Trend Anchor
    ema50_1h?: number;  // Intraday Trend Anchor
    ema21_1m?: number;  // Pullback Support
    ema21_15m?: number; // Intraday Pullback Support
    ema50_1m?: number;  // Pullback Support
    ema50_4h?: number; // Optional: 4h Trend
    volumeMA20_1m?: number; // Volume Trigger

    bbWidth?: number;
    funding?: number;
    lsr?: number;
    oi?: number;

    // Scores
    scoreMode1: number; // Pump/Short
    scoreMode2: number; // Trend/Pullback
    scoreMode3: number; // Squeeze/Breakout

    // Flags
    bias: 'LONG' | 'SHORT' | 'BOTH' | 'NEUTRAL';
    note?: string;

    // History
    klines5m: Kline[];
    klines1m: Kline[]; // New for Mode 2
    klines15m: Kline[];
    klines1h: Kline[];
}
