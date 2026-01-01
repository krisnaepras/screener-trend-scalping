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

    // 2. Exhaustion Context (RSI Overbought)
    // Mode 1 focuses on Impulse + Reversal (Short)
    // We REMOVE the BB Tightness check here to avoid overlap with Mode 3 (Squeeze)
    // Instead, we look for extended RSI
    const rsi = state.rsi5m || 50;
    const rsiScore = normalize(rsi, 60, 85); // > 85 is extreme

    // 4. Positioning (Funding/LSR)
    // High Funding -> Longs paying shorts -> Bearish signal (often)
    // High LSR -> Retail long -> Bearish
    // High Funding (> 0.01% baseline) -> Crowded Longs -> Bearish
    const funding = state.funding || 0;

    // If Funding is high (> 0.02%?), score boosts
    const fundingScore = normalize(funding, 0.01, 0.05);

    // LSR: If Retail is excessively Long (> 2), smart money might dump
    const lsr = state.lsr || 1;
    const lsrScore = normalize(lsr, 1.5, 4.0);

    const totalScore = weightedSum([
        { val: pumpScore, weight: 0.4 }, // Impulse is key
        { val: rsiScore, weight: 0.3 },  // Exhaustion
        { val: fundingScore, weight: 0.2 }, // Crowding
        { val: lsrScore, weight: 0.1 }
    ]);

    return Math.round(totalScore * 100);
}
