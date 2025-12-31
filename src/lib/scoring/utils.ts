export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

export function normalize(val: number, min: number, max: number): number {
    return clamp((val - min) / (max - min), 0, 1);
}

export function weightedSum(features: { val: number; weight: number }[]): number {
    let sum = 0;
    let totalWeight = 0;

    for (const f of features) {
        sum += f.val * f.weight;
        totalWeight += f.weight;
    }

    return totalWeight === 0 ? 0 : sum / totalWeight;
}
