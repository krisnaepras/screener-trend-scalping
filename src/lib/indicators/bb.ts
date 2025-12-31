export interface BB {
    upper: number;
    middle: number;
    lower: number;
    width: number; // (Upper - Lower) / Middle
}

export function calculateBB(data: number[], period: number = 20, stdDev: number = 2): BB[] {
    if (data.length < period) return [];

    const bbArray: BB[] = [];

    // Simple Moving Average
    for (let i = period - 1; i < data.length; i++) {
        // Slice relevant data window
        const window = data.slice(i - period + 1, i + 1);

        const sum = window.reduce((a, b) => a + b, 0);
        const mean = sum / period;

        const squaredDiffs = window.map(x => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const sd = Math.sqrt(variance);

        const upper = mean + (stdDev * sd);
        const lower = mean - (stdDev * sd);
        const width = mean !== 0 ? (upper - lower) / mean : 0;

        bbArray.push({
            upper,
            middle: mean,
            lower,
            width
        });
    }

    return bbArray;
}

export function getLastBB(data: number[], period: number = 20, stdDev: number = 2): BB | undefined {
    const bb = calculateBB(data, period, stdDev);
    return bb.length > 0 ? bb[bb.length - 1] : undefined;
}
