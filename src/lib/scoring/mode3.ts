import { normalize, weightedSum } from './utils';
import { SCORING_CONFIG } from './config';
import type { MarketState } from '../types';

export function scoreMode3(state: MarketState): number {
    const config = SCORING_CONFIG.MODE3;

    // 1. Squeeze Check (BB Width)
    const bbWidth = state.bbWidth || 1;
    // The tighter, the better for squeeze setup
    const squeezeScore = 1 - normalize(bbWidth, 0, 0.10); // 10% width is loose

    // 2. Breakout Impulse (Recent candle vs Range)
    const klines = state.klines5m;
    if (!klines || klines.length < 2) return 0;

    const lastKline = klines[klines.length - 1];
    const bodySize = Math.abs(lastKline.c - lastKline.o) / lastKline.o;

    // Big Body -> High Score
    const breakoutScore = normalize(bodySize * 100, 0, 2); // > 2% candle is breakout

    // 3. Volume Spike
    // Compare last volume to avg volume?
    // Simplified: Just use raw volume or relative volume if available
    // For now, assume we want high absolute volume for major pairs
    const volScore = normalize(state.volume, 1000000, 50000000);

    const totalScore = weightedSum([
        { val: squeezeScore, weight: config.WEIGHTS.SQUEEZE },
        { val: breakoutScore, weight: config.WEIGHTS.BREAKOUT },
        { val: volScore, weight: config.WEIGHTS.VOLUME }
    ]);

    return Math.round(totalScore * 100);
}
