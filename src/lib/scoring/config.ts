export const SCORING_CONFIG = {
    // Mode 1: Pump -> Sideways -> Short
    MODE1: {
        PUMP_5M_THRESHOLD: 1.5, // %
        PUMP_15M_THRESHOLD: 3.0, // %
        BB_WIDTH_TIGHT: 0.05, // 5% width
        RSI_OVERBOUGHT: 70,
        WEIGHTS: {
            PUMP: 0.4,
            TIGHTNESS: 0.2,
            RSI: 0.2,
            FUNDING: 0.1,
            LSR: 0.1
        }
    },
    // Mode 2: Trend + Pullback
    MODE2: {
        TREND_SLOPE_MIN: 0.0005, // arbitrary unit per candle?
        PULLBACK_RSI_MIN: 40,
        PULLBACK_RSI_MAX: 60,
        WEIGHTS: {
            TREND: 0.5,
            PULLBACK: 0.3,
            CONFIRMATION: 0.2
        },
        PULLBACK_LOWER_TOLERANCE: 0.998,
        PULLBACK_UPPER_TOLERANCE: 1.002
    },
    // Mode 3: Squeeze -> Breakout
    MODE3: {
        SQUEEZE_PERCENTILE: 0.1, // lowest 10%
        BREAKOUT_VOL_MULTIPLIER: 2.0,
        WEIGHTS: {
            SQUEEZE: 0.4,
            BREAKOUT: 0.4,
            VOLUME: 0.2
        }
    }
};
