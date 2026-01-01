import { normalize, weightedSum } from './utils';
import { SCORING_CONFIG } from './config';
import type { MarketState } from '../types';

export function scoreMode2(state: MarketState, config: any): number {
    const isIntraday = config.IS_INTRADAY;
    const entryKlines = isIntraday ? state.klines15m : state.klines1m;

    // Prereq: Data availability
    if (!entryKlines || entryKlines.length < 20) return 0;

    // Select Indicators based on Mode
    // Scalping: Anchor=15m, Setup=1m (EMA21/50)
    // Intraday: Anchor=1h, Setup=15m (EMA21/50)
    const anchorTrend = isIntraday ? state.ema50_1h : state.ema50_15m;
    const entryEma21 = isIntraday ? state.ema21_15m : state.ema21_1m;
    const entryEma50 = isIntraday ? state.ema50_15m : state.ema50_1m;
    const entryAdx = isIntraday ? 30 : (state.adx1m || 30); // Placeholder for ADX 15m? Or just ignore ADX for intraday for now.

    if (!anchorTrend || !entryEma21 || !entryEma50) return 0;

    const currentPrice = state.price;

    // 1. alignment
    const isBullishAnchor = currentPrice > anchorTrend; // Simplified "Price > EMA50"

    // Setup Trend
    const isBullishSetup = entryEma21 > entryEma50;
    const isBearishSetup = entryEma21 < entryEma50;

    // ADX Filter
    if (!isIntraday && entryAdx < 20) return 0; // Only filter ADX on scalping for now

    let trendScore = 0;
    // MTF Alignment
    if (isBullishAnchor && isBullishSetup) {
        trendScore = 1;
    } else if (!isBullishAnchor && isBearishSetup) {
        trendScore = 1;
    } else {
        return 0; // Counter-trend
    }

    // --- 2. Pullback ---
    const lastKline = entryKlines[entryKlines.length - 1];
    const low = lastKline.l;
    const high = lastKline.h;

    // Value Zone: Between EMA 21 and EMA 50
    let pullbackScore = 0;

    if (isBullishAnchor) {
        // Long
        const zoneTop = entryEma21;
        const zoneBottom = entryEma50;

        // Check low
        if (low <= zoneTop && low >= zoneBottom * config.PULLBACK_LOWER_TOLERANCE) {
            pullbackScore = 1;
        } else if (low > zoneTop && low < zoneTop * config.PULLBACK_UPPER_TOLERANCE) {
            pullbackScore = 0.8;
        }
    } else {
        // Short
        const zoneBottom = entryEma21;
        const zoneTop = entryEma50;

        if (high >= entryEma21 && high <= entryEma50 * config.PULLBACK_UPPER_TOLERANCE) {
            pullbackScore = 1;
        } else if (high < entryEma21 && high > entryEma21 * config.PULLBACK_LOWER_TOLERANCE) {
            pullbackScore = 0.8;
        }
    }

    // --- 3. Trigger ---
    let triggerScore = 0;
    const close = lastKline.c;
    const open = lastKline.o;
    const vol = lastKline.v;
    const volMA = state.volumeMA20_1m || vol; // TODO: VolumeMA for 15m?

    const volOk = vol > volMA;

    if (isBullishAnchor) {
        const reclaimed = close > entryEma21;
        const isGreen = close > open;
        if (reclaimed && volOk && isGreen) {
            triggerScore = 1;
        } else if (reclaimed && isGreen) {
            triggerScore = 0.5;
        }
    } else {
        const reclaimed = close < entryEma21;
        const isRed = close < open;
        if (reclaimed && volOk && isRed) {
            triggerScore = 1;
        } else if (reclaimed && isRed) {
            triggerScore = 0.5;
        }
    }

    if (trendScore === 0) return 0;

    return Math.round(weightedSum([
        { val: trendScore, weight: config.WEIGHTS.TREND },
        { val: pullbackScore, weight: config.WEIGHTS.PULLBACK },
        { val: triggerScore, weight: config.WEIGHTS.CONFIRMATION }
    ]) * 100);
}
