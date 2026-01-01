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
        IS_INTRADAY: false,
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

export const INTRADAY_CONFIG = {
    // Mode 1: 1H Pump (Slower, bigger moves)
    MODE1: {
        PUMP_5M_THRESHOLD: 3.0, // Used as "Pump 1H" actually, reusing var name logic or mapping
        PUMP_15M_THRESHOLD: 5.0,
        BB_WIDTH_TIGHT: 0.10, // Wider tolerance for 1H
        RSI_OVERBOUGHT: 75,
        WEIGHTS: SCORING_CONFIG.MODE1.WEIGHTS
    },
    // Mode 2: 1H Trend + 15m Pullback
    MODE2: {
        IS_INTRADAY: true,
        TREND_SLOPE_MIN: 0.001,
        PULLBACK_RSI_MIN: 40,
        PULLBACK_RSI_MAX: 60,
        WEIGHTS: SCORING_CONFIG.MODE2.WEIGHTS,
        PULLBACK_LOWER_TOLERANCE: 0.995, // Wider zones
        PULLBACK_UPPER_TOLERANCE: 1.005
    },
    // Mode 3: 1H Squeeze
    MODE3: {
        SQUEEZE_PERCENTILE: 0.15,
        BREAKOUT_VOL_MULTIPLIER: 2.0,
        WEIGHTS: SCORING_CONFIG.MODE3.WEIGHTS
    }
};

export const getScoringConfig = (mode: 'scalping' | 'intraday') => {
    return mode === 'intraday' ? INTRADAY_CONFIG : SCORING_CONFIG;
};
