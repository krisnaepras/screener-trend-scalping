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
    rsi1m?: number; // New for Mode 2

    // MTF Indicators for Mode 2
    ema50_15m?: number; // Major Trend Anchor
    ema21_1m?: number;  // Pullback Support
    ema50_1m?: number;  // Pullback Support
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
}
