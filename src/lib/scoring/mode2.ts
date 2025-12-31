import { normalize, weightedSum } from './utils';
import { SCORING_CONFIG } from './config';
import type { MarketState } from '../types';

export function scoreMode2(state: MarketState): number {
    const config = SCORING_CONFIG.MODE2;
    const klines1m = state.klines1m;

    // Prereq: Data availability
    if (!klines1m || klines1m.length < 20) return 0;
    if (!state.ema50_15m || !state.ema50_1m || !state.ema21_1m) return 0;

    // --- 1. MTF Trend Filter (50%) ---
    // Rule: Trade ONLY in direction of 15m Trend
    // Long: Close 15m > EMA 50 (15m)
    // Short: Close 15m < EMA 50 (15m)
    const ema50_15m = state.ema50_15m;
    // We approximate 15m close with current price for real-time check
    const currentPrice = state.price;

    const isBullish15m = currentPrice > ema50_15m;
    const isBearish15m = currentPrice < ema50_15m;

    // Check slope of EMA 15m (simplified: current price relative to EMA implies slope if sustained, 
    // but better check would be computed slope. For now, price position is the anchor)

    let trendScore = 0;
    if (isBullish15m) {
        trendScore = 1; // Major trend UP
    } else if (isBearish15m) {
        trendScore = 1; // Major trend DOWN
    }

    // --- 2. Pullback Structure (30%) ---
    // We look for 1m price retracing to the "Value Zone" between EMA 21 and EMA 50
    const ema21 = state.ema21_1m!;
    const ema50 = state.ema50_1m!;
    const low = klines1m[klines1m.length - 1].l;
    const high = klines1m[klines1m.length - 1].h;

    let pullbackScore = 0;
    if (isBullish15m) {
        // Long Setup: Price dips into EMA 21-50 zone
        // Upper bound: EMA 21 (shallow support)
        // Lower bound: EMA 50 (deep support)
        // Check if Low touched the zone or is near it
        const distTo21 = (low - ema21) / ema21;
        const distTo50 = (low - ema50) / ema50;

        // Perfect: Low touches EMA 21 or goes slightly below
        // If Low > EMA 21, it's strong momentum, not pullback yet (unless tight flag)
        if (low <= ema21 && low >= ema50 * 0.998) {
            pullbackScore = 1; // Bullseye
        } else if (low > ema21 && low < ema21 * 1.002) {
            pullbackScore = 0.8; // Near miss / very shallow
        }
    } else {
        // Short Setup: Price rallies into EMA 21-50 zone
        // Check if High touched zone
        if (high >= ema21 && high <= ema50 * 1.002) {
            pullbackScore = 1;
        } else if (high < ema21 && high > ema21 * 0.998) {
            pullbackScore = 0.8;
        }
    }

    // --- 3. Trigger & Validation (20%) ---
    // 1. Reclaim: Close back above EMA 21 (for Long)
    // 2. Volume: 1m Volume > MA(20) Volume
    let triggerScore = 0;
    const close = klines1m[klines1m.length - 1].c;
    const vol = klines1m[klines1m.length - 1].v;
    const volMA = state.volumeMA20_1m || vol; // Fallback

    const volOk = vol > volMA;

    if (isBullish15m) {
        const reclaimed = close > ema21;
        if (reclaimed && volOk) {
            triggerScore = 1;
        } else if (reclaimed) {
            triggerScore = 0.5; // Valid close, weak volume
        }
    } else {
        const reclaimed = close < ema21;
        if (reclaimed && volOk) {
            triggerScore = 1;
        } else if (reclaimed) {
            triggerScore = 0.5;
        }
    }

    // Final Assembly
    // If Major Trend is wrong, Score = 0 (Filter)
    if (trendScore === 0) return 0;

    // If not in pullback territory (e.g. accelerating away), score low
    // Exception: If we have trigger score (reclaim), it implies we WERE in pullback

    const totalScore = weightedSum([
        { val: trendScore, weight: 0.5 },
        { val: pullbackScore, weight: 0.3 },
        { val: triggerScore, weight: 0.2 }
    ]);

    return Math.round(totalScore * 100);
}
