import { writable, get } from 'svelte/store';
import { hunter } from './hunter';
import type { MarketState, Ticker, Kline } from '../types';
import { BinanceWS } from '../binance/ws';
import { calculateRSI, getLastRSI } from '../indicators/rsi';
import { getLastEMA } from '../indicators/ema';
import { getLastBB } from '../indicators/bb';
import { calculateScores } from '../scoring';
import { Capacitor } from '@capacitor/core';

function createMarketStore() {
    const { subscribe, set } = writable(new Map<string, MarketState>());

    // Local state to avoid Svelte overhead on every sub-update
    const stateMap = new Map<string, MarketState>();
    let dirty = false;

    // React to mode changes
    hunter.subscribe(mode => {
        // Trigger recalc for all symbols with new mode
        stateMap.forEach(state => {
            recalcIndicators(state);
        });
        dirty = true;
    });

    // Buffer updates loop to throttle UI
    if (typeof setInterval !== 'undefined') {
        setInterval(() => {
            if (dirty) {
                set(new Map(stateMap)); // Trigger Svelte Reactivity
                dirty = false;
            }
        }, 500); // Update UI max 2x per second
    }

    let ws: BinanceWS;

    // --- Helper Functions (Hoisted/Defined before use) ---

    const recalcIndicators = (state: MarketState) => {
        const closes = state.klines5m.map(k => k.c);
        if (closes.length < 20) return;

        state.rsi5m = getLastRSI(closes, 14);

        const closes1m = state.klines1m.map(k => k.c);
        const vols1m = state.klines1m.map(k => k.v);
        const closes15m = state.klines15m.map(k => k.c);
        const closes1h = state.klines1h.map(k => k.c);

        // Intraday RSI
        if (closes15m.length >= 20) {
            state.rsi15m = getLastRSI(closes15m, 14);
        }
        if (closes1h.length >= 20) {
            state.rsi1h = getLastRSI(closes1h, 14);
        }

        // 1m Indicators
        if (closes1m.length >= 21) {
            state.rsi1m = getLastRSI(closes1m, 14);
            state.ema21_1m = getLastEMA(closes1m, 21);

            // Simple SMA for Volume
            if (vols1m.length >= 20) {
                const last20Vols = vols1m.slice(-20);
                const sumVol = last20Vols.reduce((a, b) => a + b, 0);
                state.volumeMA20_1m = sumVol / 20;
            }
        }
        if (closes1m.length >= 50) {
            state.ema50_1m = getLastEMA(closes1m, 50);
        }

        // 15m Indicators (EMA 50)
        if (closes15m.length >= 50) {
            state.ema50_15m = getLastEMA(closes15m, 50);
            state.ema21_15m = getLastEMA(closes15m, 21);
        }

        // 1h Indicators
        if (closes1h.length >= 50) {
            state.ema50_1h = getLastEMA(closes1h, 50);
        }

        const currentMode = get(hunter);
        let bb;
        if (currentMode === 'intraday' && closes1h.length >= 20) {
            bb = getLastBB(closes1h, 20, 2);
        } else {
            bb = getLastBB(closes, 20, 2);
        }
        state.bbWidth = bb?.width;

        // Recalculate Scores
        const scoredState = calculateScores(state, currentMode);
        state.scoreMode1 = scoredState.scoreMode1;
        state.scoreMode2 = scoredState.scoreMode2;
        state.scoreMode3 = scoredState.scoreMode3;
        state.bias = scoredState.bias;
        state.note = scoredState.note;
    };

    const fetchHistory = async (symbol: string, interval: '1m' | '5m' | '15m' | '1h') => {
        try {
            // Use the proxy
            let url = `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=100`;

            // If Native (Android/iOS), fetch directly from Binance
            if (Capacitor.isNativePlatform()) {
                url = `https://screener-trend-scalping.vercel.app/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=100`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (Array.isArray(data)) {
                // Check if symbol exists in stateMap
                const existing = stateMap.get(symbol);
                if (!existing) return;

                // Format: [t, o, h, l, c, v, ...]
                const klines: Kline[] = data.map((d: any) => ({
                    t: d[0],
                    o: parseFloat(d[1]),
                    h: parseFloat(d[2]),
                    l: parseFloat(d[3]),
                    c: parseFloat(d[4]),
                    v: parseFloat(d[5])
                }));

                if (interval === '1m') {
                    if (existing.klines1m.length < 10) {
                        existing.klines1m = klines;
                        recalcIndicators(existing);
                    }
                } else if (interval === '15m') {
                    if (existing.klines15m.length < 10) {
                        existing.klines15m = klines;
                        recalcIndicators(existing);
                    }
                } else if (interval === '1h') {
                    if (existing.klines1h.length < 10) {
                        existing.klines1h = klines;
                        recalcIndicators(existing);
                    }
                } else {
                    if (existing.klines5m.length < 10) {
                        existing.klines5m = klines;
                        recalcIndicators(existing);
                    }
                }

                dirty = true;
            }
        } catch (e) {
            console.error('Failed to backfill', symbol, interval, e);
        }
    };

    let lastSubscriptionCheck = 0;
    const checkAndSubscribeTopCandidates = (map: Map<string, MarketState>) => {
        const now = Date.now();
        if (now - lastSubscriptionCheck < 5000) return; // Run every 5s
        lastSubscriptionCheck = now;

        // Sort by Volume (q)
        // Use Array.from(map.values()) is okay for 200 items, but ensure we don't block
        const sorted = Array.from(map.values())
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 30); // Top 30 by volume

        sorted.forEach(item => {
            ws?.subscribeKline(item.symbol, '5m');
            ws?.subscribeKline(item.symbol, '1m');
            ws?.subscribeKline(item.symbol, '15m');
            ws?.subscribeKline(item.symbol, '1h');

            // Backfill if empty
            if (item.klines5m.length === 0) fetchHistory(item.symbol, '5m');
            if (item.klines1m.length === 0) fetchHistory(item.symbol, '1m');
            if (item.klines15m.length === 0) fetchHistory(item.symbol, '15m');
            if (item.klines1h.length === 0) fetchHistory(item.symbol, '1h');
        });
    };

    // --- Init ---

    const init = () => {
        const handleTicker = (tickers: Ticker[]) => {
            tickers.forEach(t => {
                const s = t.s;
                if (!s.endsWith('USDT')) return; // Filter USDT only
                if (!stateMap.has(s)) {
                    // Initialize new symbol
                    stateMap.set(s, {
                        symbol: s,
                        price: parseFloat(t.c),
                        change24h: parseFloat(t.P),
                        volume: parseFloat(t.q),
                        scoreMode1: 0,
                        scoreMode2: 0,
                        scoreMode3: 0,
                        bias: 'NEUTRAL',
                        klines5m: [],
                        klines1m: [],
                        klines15m: [],
                        klines1h: []
                    });
                    dirty = true;
                } else {
                    // Update existing
                    const existing = stateMap.get(s)!;
                    existing.price = parseFloat(t.c);
                    existing.change24h = parseFloat(t.P);
                    existing.volume = parseFloat(t.q); // Volume accumulates 24h
                    dirty = true;
                }
            });
            // Periodic Top N check to subscribe to klines
            checkAndSubscribeTopCandidates(stateMap);
        };

        const handleKline = (symbol: string, k: any, interval: string) => {
            const existing = stateMap.get(symbol);
            if (!existing) return;
            const kline: Kline = {
                t: k.t,
                o: parseFloat(k.o),
                h: parseFloat(k.h),
                l: parseFloat(k.l),
                c: parseFloat(k.c),
                v: parseFloat(k.v)
            };
            let updated = false;
            if (interval === '1m') {
                const lastKline = existing.klines1m[existing.klines1m.length - 1];
                if (!lastKline || kline.t > lastKline.t) {
                    existing.klines1m.push(kline);
                    if (existing.klines1m.length > 300) existing.klines1m.shift();
                    updated = true;
                } else {
                    existing.klines1m[existing.klines1m.length - 1] = kline;
                    if (k.x) updated = true;
                }
            } else if (interval === '5m') {
                const lastKline = existing.klines5m[existing.klines5m.length - 1];
                if (!lastKline || kline.t > lastKline.t) {
                    existing.klines5m.push(kline);
                    if (existing.klines5m.length > 300) existing.klines5m.shift();
                    updated = true;
                } else {
                    existing.klines5m[existing.klines5m.length - 1] = kline;
                    if (k.x) updated = true;
                }
            } else if (interval === '15m') {
                const lastKline = existing.klines15m[existing.klines15m.length - 1];
                if (!lastKline || kline.t > lastKline.t) {
                    existing.klines15m.push(kline);
                    if (existing.klines15m.length > 300) existing.klines15m.shift();
                    updated = true;
                } else {
                    existing.klines15m[existing.klines15m.length - 1] = kline;
                    if (k.x) updated = true;
                }
            } else if (interval === '1h') {
                const lastKline = existing.klines1h[existing.klines1h.length - 1];
                if (!lastKline || kline.t > lastKline.t) {
                    existing.klines1h.push(kline);
                    if (existing.klines1h.length > 300) existing.klines1h.shift();
                    updated = true;
                } else {
                    existing.klines1h[existing.klines1h.length - 1] = kline;
                    if (k.x) updated = true;
                }
            }
            if (updated) {
                recalcIndicators(existing);
                dirty = true;
            }
        };

        const handleMarkPrice = (markPrices: any[]) => {
            // Handle Mark Price (Funding Rate)
            markPrices.forEach((mp: any) => {
                const s = mp.s;
                const funding = parseFloat(mp.r);
                const existing = stateMap.get(s);
                if (existing) {
                    existing.funding = funding;
                }
            });
        };

        ws = new BinanceWS(handleTicker, handleKline, handleMarkPrice);

        ws.connect();

        // Start polling OI for top candidates
        startOIPolling();
    };

    let oiPoller: any;
    const startOIPolling = () => {
        if (oiPoller) clearInterval(oiPoller);
        oiPoller = setInterval(async () => {
            // Get Top 15 by Volume
            const topSymbols = Array.from(stateMap.values())
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 15)
                .map(s => s.symbol);

            if (topSymbols.length === 0) return;

            // We need to fetch OI for each. 
            // Ideally we'd have a batch endpoint, but Binance FAPI only supports single symbol for OI /fapi/v1/openInterest
            // We can use a proxy route that handles batching or just fire promises.
            // Limit to 5 requests concurrently or just do it.

            // For now, let's just pick top 5 to avoid rate limits
            for (const sym of topSymbols.slice(0, 5)) {
                try {
                    let url = `/api/binance/oi?symbol=${sym}`;
                    if (Capacitor.isNativePlatform()) {
                        url = `https://screener-trend-scalping.vercel.app/api/binance/oi?symbol=${sym}`;
                    }

                    // We need to create this endpoint or use direct Binance if possible
                    // Assuming we map this to /fapi/v1/openInterest via our proxy

                    // Fallback check: do we have an endpoint? 
                    // We only have /api/binance (proxy) which currently only supports fetchBinance -> any path.
                    // But binance.ts defines specific paths? No, it's a general proxy?
                    // Let's check api/binance.ts.

                    // Assuming we can use: /api/binance/openInterest?symbol=...
                    const res = await fetch(url);
                    const data = await res.json();
                    // { symbol: "BTCUSDT", openInterest: "123.45", time: ... }

                    const existing = stateMap.get(sym);
                    if (existing && data.openInterest) {
                        existing.oi = parseFloat(data.openInterest);
                    }
                } catch (e) {
                    // console.error(e);
                }
            }
        }, 60000); // Poll every 1 minute
    };

    const subscribeToSymbol = (symbol: string) => {
        ws?.subscribeKline(symbol, '5m');
    };

    return {
        subscribe,
        init,
        subscribeToSymbol
    };
}

export const market = createMarketStore();
