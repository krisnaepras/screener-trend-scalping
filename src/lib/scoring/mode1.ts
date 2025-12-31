import { normalize, weightedSum, clamp } from './utils';
import { SCORING_CONFIG } from './config';
import type { MarketState } from '../types';

export function scoreMode1(state: MarketState): number {
    const config = SCORING_CONFIG.MODE1;

    // 1. Pump Strength (Last 5m candle change or recent trend)
    // We need klines. Let's assume klines5m are up to date.
    const klines = state.klines5m;
    if (!klines || klines.length < 2) return 0;

    const lastClose = klines[klines.length - 1].c;
    const prevClose = klines[klines.length - 2].c;
    const pump5m = ((lastClose - prevClose) / prevClose) * 100;

    // Normalize pump: 0 to Threshold*2
    const pumpScore = normalize(pump5m, 0, config.PUMP_5M_THRESHOLD * 2);

    // 2. Sideways / Tightness (Low BB Width)
    // Assume bbWidth is pre-calculated or calculate here.
    // Ideally pre-calc in MarketStore update loop to save perf.
    const bbWidth = state.bbWidth || 1; // Default to 1 (wide) if missing

    // Lower width is better -> Invert
    // If width < TIGHT, score is high.
    // If width > TIGHT * 3, score is 0.
    const tightnessScore = 1 - normalize(bbWidth, config.BB_WIDTH_TIGHT, config.BB_WIDTH_TIGHT * 3);

    // 3. RSI Exhaustion
    // High RSI -> Ready for short
    const rsi = state.rsi5m || 50;
    const rsiScore = normalize(rsi, 50, 100);

    // 4. Positioning (Funding/LSR)
    // High Funding -> Longs paying shorts -> Bearish signal (often)
    // High LSR -> Retail long -> Bearish
    const funding = state.funding || 0;
    const lsr = state.lsr || 1;

    const fundingScore = normalize(funding, 0, 0.05); // 0.05% is high
    const lsrScore = normalize(lsr, 1, 4); // LSR > 4 is extreme long

    const totalScore = weightedSum([
        { val: pumpScore, weight: config.WEIGHTS.PUMP },
        { val: tightnessScore, weight: config.WEIGHTS.TIGHTNESS },
        { val: rsiScore, weight: config.WEIGHTS.RSI },
        { val: fundingScore, weight: config.WEIGHTS.FUNDING },
        { val: lsrScore, weight: config.WEIGHTS.LSR }
    ]);

    return Math.round(totalScore * 100);
}
