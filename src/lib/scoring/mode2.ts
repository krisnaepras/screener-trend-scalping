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
    const ema21 = state.ema21_1m!;
    const ema50 = state.ema50_1m!;
    // We approximate 15m close with current price for real-time check
    const currentPrice = state.price;

    // Trend Alignment: 1m Trend must agree with 15m Trend
    // Bullish: 15m Price > EMA50 AND 1m EMA21 > EMA50
    const isBullish15m = currentPrice > ema50_15m && ema21 > ema50;
    const isBearish15m = currentPrice < ema50_15m && ema21 < ema50;

    // Check slope of EMA 15m (simplified: current price relative to EMA implies slope if sustained, 
    // but better check would be computed slope. For now, price position is the anchor)

    let trendScore = 0;
    // ADX Filter: Trend must be strong (> 25) to trust the EMA alignment
    const adx = state.adx1m || 30; // Default to 30 (strong) if missing to not block valid overlapping setups

    // If ADX < 20, it's chopping, ignore trend signals
    if (adx < 20) {
        return 0;
    }

    // MTF Anchor: Check 15m Trend Alignment
    // Price must be on the correct side of 15m EMA50
    const mtfAlignedBull = currentPrice > ema50_15m;
    const mtfAlignedBear = currentPrice < ema50_15m;

    // Strict Rule: If not aligned with 15m, score is 0 (or severely penalized)
    if (!mtfAlignedBull && isBullish15m) { // Wait, isBullish15m variable name is confusing from previous logic
        // Let's redefine logic clearly
    }

    if (ema21 > ema50 && mtfAlignedBull) {
        trendScore = 1; // Bullish Trend + MTF confirmation
    } else if (ema21 < ema50 && mtfAlignedBear) {
        trendScore = 1; // Bearish Trend + MTF Confirmation
    } else {
        return 0; // Counter-trend or messy
    }

    // --- 2. Pullback Structure (30%) ---
    // We look for 1m price retracing to the "Value Zone" between EMA 21 and EMA 50
    const lastKline = klines1m[klines1m.length - 1];
    const low = lastKline.l;
    const high = lastKline.h;

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
        if (low <= ema21 && low >= ema50 * config.PULLBACK_LOWER_TOLERANCE) {
            pullbackScore = 1; // Bullseye
        } else if (low > ema21 && low < ema21 * config.PULLBACK_UPPER_TOLERANCE) {
            pullbackScore = 0.8; // Near miss / very shallow
        }
    } else {
        // Short Setup: Price rallies into EMA 21-50 zone
        // Check if High touched zone
        if (high >= ema21 && high <= ema50 * config.PULLBACK_UPPER_TOLERANCE) {
            pullbackScore = 1;
        } else if (high < ema21 && high > ema21 * config.PULLBACK_LOWER_TOLERANCE) {
            pullbackScore = 0.8;
        }
    }

    // --- 3. Trigger & Validation (20%) ---
    // 1. Reclaim: Close back above EMA 21 (for Long)
    // 2. Volume: 1m Volume > MA(20) Volume
    // 3. Candle Color: Must be same direction as trend (Bullish=Green, Bearish=Red)
    let triggerScore = 0;

    const close = lastKline.c;
    const open = lastKline.o;
    const vol = lastKline.v;
    const volMA = state.volumeMA20_1m || vol; // Fallback

    const volOk = vol > volMA;

    if (isBullish15m) {
        const reclaimed = close > ema21;
        const isGreen = close > open;
        if (reclaimed && volOk && isGreen) {
            triggerScore = 1;
        } else if (reclaimed && isGreen) {
            triggerScore = 0.5; // Valid close, weak volume
        }
    } else {
        const reclaimed = close < ema21;
        const isRed = close < open;
        if (reclaimed && volOk && isRed) {
            triggerScore = 1;
        } else if (reclaimed && isRed) {
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
