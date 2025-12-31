export function calculateRSI(data: number[], period: number = 14): number[] {
    if (data.length <= period) return [];

    const rsiArray: number[] = [];
    let gains = 0;
    let losses = 0;

    // First average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = data[i] - data[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    let rs = avgGain / avgLoss;
    rsiArray.push(100 - (100 / (1 + rs)));

    // Smoothed RSI
    for (let i = period + 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        if (avgLoss === 0) {
            rsiArray.push(100);
        } else {
            rs = avgGain / avgLoss;
            rsiArray.push(100 - (100 / (1 + rs)));
        }
    }

    return rsiArray;
}

export function getLastRSI(data: number[], period: number = 14): number | undefined {
    const rsi = calculateRSI(data, period);
    return rsi.length > 0 ? rsi[rsi.length - 1] : undefined;
}
