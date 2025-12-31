import { scoreMode1 } from './mode1';
import { scoreMode2 } from './mode2';
import { scoreMode3 } from './mode3';
import type { MarketState } from '../types';

export function calculateScores(state: MarketState): MarketState {
    const s1 = scoreMode1(state);
    const s2 = scoreMode2(state);
    const s3 = scoreMode3(state);

    // Determine Bias based on highest score or specific logic
    let bias: MarketState['bias'] = 'NEUTRAL';
    let note = '';

    // Simple logic: whichever mode is highest dominates
    if (s1 > 70) {
        bias = 'SHORT';
        note = 'Pump Exhaustion / Squeeze';
    } else if (s2 > 70) {
        bias = state.change24h > 0 ? 'LONG' : 'SHORT';
        note = 'Trend Continuation';
    } else if (s3 > 70) {
        bias = 'BOTH';
        note = 'Squeeze Breakout';
    }

    return {
        ...state,
        scoreMode1: s1,
        scoreMode2: s2,
        scoreMode3: s3,
        bias,
        note
    };
}
