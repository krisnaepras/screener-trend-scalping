export function calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emaArray: number[] = [];

    // Simple MA for the first point
    let sum = 0;
    for (let i = 0; i < period; i++) {
        if (i < data.length) sum += data[i];
    }
    let ema = sum / period;

    // Fill initial non-EMA values with null or approximate if needed, 
    // but typically we just start EMA from period index.
    // For simplicity, we just push the first SMA at index 'period-1' (conceptually).
    // But to align with lightweight-charts or standard, we iterate.

    // Standard EMA:
    // EMA_today = (Value_today * (k)) + (EMA_yesterday * (1-k))

    // We need to handle the start carefully.
    if (data.length < period) return [];

    // Calculate initial SMA
    let initialSum = 0;
    for (let i = 0; i < period; i++) {
        initialSum += data[i];
    }
    let prevEma = initialSum / period;
    emaArray.push(prevEma); // at index period-1 relative to start

    for (let i = period; i < data.length; i++) {
        const currentEma = (data[i] * k) + (prevEma * (1 - k));
        emaArray.push(currentEma);
        prevEma = currentEma;
    }

    return emaArray; // Note: this array is shorter than input by period-1
}

export function getLastEMA(data: number[], period: number): number | undefined {
    const emas = calculateEMA(data, period);
    return emas.length > 0 ? emas[emas.length - 1] : undefined;
}
