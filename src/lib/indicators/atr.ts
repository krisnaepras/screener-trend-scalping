import { type Kline } from '../types';

export function calculateATR(klines: Kline[], period: number = 14): number[] {
    if (klines.length <= period) return [];

    const trs: number[] = [];

    // Calculate True Range
    // TR = Max(H-L, |H-Cp|, |L-Cp|)
    for (let i = 1; i < klines.length; i++) {
        const h = klines[i].h;
        const l = klines[i].l;
        const cp = klines[i - 1].c;

        const tr = Math.max(h - l, Math.abs(h - cp), Math.abs(l - cp));
        trs.push(tr);
    }

    // First ATR is Simple MA of TR
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += trs[i];
    }
    let prevATR = sum / period;
    const atrArray: number[] = [prevATR];

    // Smoothing
    // Current ATR = [(Prior ATR x 13) + Current TR] / 14
    for (let i = period; i < trs.length; i++) {
        const currentTR = trs[i];
        const currentATR = ((prevATR * (period - 1)) + currentTR) / period;
        atrArray.push(currentATR);
        prevATR = currentATR;
    }

    return atrArray;
}
