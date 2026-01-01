import type { Kline } from '../types';

/**
 * Calculate ADX (Average Directional Index)
 * Returns the ADX value and optionally +DI/-DI for the last candle.
 */
export function calculateADX(klines: Kline[], period: number = 14): { adx: number; pdi: number; mdi: number } {
    if (klines.length < period * 2) return { adx: 0, pdi: 0, mdi: 0 };

    let tr = 0;
    let pdm = 0; // +DM
    let mdm = 0; // -DM

    // Smooth arrays
    let smoothTR = 0;
    let smoothPDM = 0;
    let smoothMDM = 0;

    const adxValues: number[] = [];

    // First calculations
    for (let i = 1; i < klines.length; i++) {
        const high = klines[i].h;
        const low = klines[i].l;
        const prevHigh = klines[i - 1].h;
        const prevLow = klines[i - 1].l;
        const prevClose = klines[i - 1].c;

        const hl = high - low;
        const hc = Math.abs(high - prevClose);
        const lc = Math.abs(low - prevClose);

        const currentTR = Math.max(hl, hc, lc);

        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        let currentPDM = 0;
        let currentMDM = 0;

        if (upMove > downMove && upMove > 0) {
            currentPDM = upMove;
        }
        if (downMove > upMove && downMove > 0) {
            currentMDM = downMove;
        }

        // Wilder's Smoothing
        if (i < period + 1) {
            // Initial accumulation
            tr += currentTR;
            pdm += currentPDM;
            mdm += currentMDM;
            if (i === period) {
                smoothTR = tr;
                smoothPDM = pdm;
                smoothMDM = mdm;
            }
        } else {
            smoothTR = smoothTR - (smoothTR / period) + currentTR;
            smoothPDM = smoothPDM - (smoothPDM / period) + currentPDM;
            smoothMDM = smoothMDM - (smoothMDM / period) + currentMDM;
        }

        // Calculate DX only after we have smoothed values
        if (i >= period) {
            const pdi = (smoothPDM / smoothTR) * 100;
            const mdi = (smoothMDM / smoothTR) * 100;

            const diDiff = Math.abs(pdi - mdi);
            const diSum = pdi + mdi;
            const dx = diSum === 0 ? 0 : (diDiff / diSum) * 100;

            // ADX Smoothing
            // Need to store DX to smooth it? 
            // Standard ADX is EMA of DX.
            // Simplified for real-time: We just return the last snapshot if we assume history is sufficient
            // But to get correct ADX we need to smooth DX over `period` as well.

            if (adxValues.length === 0) {
                // First ADX is average of period DXs? 
                // Usually calculating ADX correctly requires a sequence of DX.
                // Let's store DX and assume caller provides enough history.
                adxValues.push(dx); // Initial
            } else {
                const prevADX = adxValues[adxValues.length - 1];
                const currentADX = ((prevADX * (period - 1)) + dx) / period;
                adxValues.push(currentADX);
            }
        }
    }

    const lastPDI = (smoothPDM / smoothTR) * 100;
    const lastMDI = (smoothMDM / smoothTR) * 100;
    const lastADX = adxValues[adxValues.length - 1] || 0;

    return { adx: lastADX, pdi: lastPDI, mdi: lastMDI };
}
