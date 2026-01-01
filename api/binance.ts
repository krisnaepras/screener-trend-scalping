import { Elysia, t } from 'elysia';

// Use a rotating list of IPs if DNS fails, or just rely on system DNS.
// User requested 1.1.1.1 / 8.8.8.8 to avoid blocks.
// In a serverless env (Vercel), usually no block.
// For local, we rely on the system or a VPN.
// Implementing a full DoH client here is out of scope for a single file without deps,
// so we stick to standard fetch.

const BASE_URL = 'https://fapi.binance.com';

// Cache System
const CACHE = new Map<string, { data: any, expiry: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds default

const getHeaders = () => ({
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=5',
    'Content-Type': 'application/json',
});

// Helper for fetch with timeout and caching
const fetchBinance = async (path: string, params: Record<string, any>, ttl = CACHE_TTL) => {
    const url = new URL(path, BASE_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    const cacheKey = url.toString();

    // 1. Check Cache
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
        console.log(`[CACHE] Serving ${path}`);
        return cached.data;
    }

    try {
        console.log(`[API] Fetching ${path}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': 'ScalpingHunter/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Binance API Error ${res.status}: ${errorText}`);
            // If rate limited, throw specific error or return fallback
            if (res.status === 418 || res.status === 429) {
                return { error: 'Rate Limit Exceeded', code: res.status };
            }
            throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // 2. Set Cache
        CACHE.set(cacheKey, { data, expiry: Date.now() + ttl });

        // Prune cache occasionally (naive approach)
        if (CACHE.size > 1000) CACHE.clear();

        return data;
    } catch (e: any) {
        console.error(`Fetch failed: ${e.message}`);
        // Return cached stale data if available, otherwise error
        if (cached) {
            console.warn('[CACHE] Serving stale data due to error');
            return cached.data;
        }
        return { error: 'Failed to fetch data from Binance', details: e.message };
    }
};

const app = new Elysia({ prefix: '/api/binance' })
    .get('/funding', async ({ query, set }) => {
        set.headers = getHeaders();
        // premiumIndex gives Mark Price and Funding Rate
        return fetchBinance('/fapi/v1/premiumIndex', { symbol: query.symbol });
    }, {
        query: t.Object({
            symbol: t.Optional(t.String()) // Optional because if empty, it returns all
        })
    })
    .get('/lsr', async ({ query, set }) => {
        set.headers = getHeaders();
        // Top Long/Short Account Ratio
        return fetchBinance('/futures/data/topLongShortAccountRatio', {
            symbol: query.symbol,
            period: query.period || '5m',
            limit: query.limit || 30
        });
    }, {
        query: t.Object({
            symbol: t.String(),
            period: t.Optional(t.String()),
            limit: t.Optional(t.Numeric())
        })
    })
    .get('/oi', async ({ query, set }) => {
        set.headers = getHeaders();
        // Open Interest Statistics (history)
        // Note: For current OI, use /fapi/v1/openInterest. For history: /futures/data/openInterestHist
        // The requirements mention "Open Interest history (OI delta)", so we likely want Hist.
        // But /fapi/v1/openInterest is lighter for current.
        // Let's support history for the sparklines/delta.
        return fetchBinance('/futures/data/openInterestHist', {
            symbol: query.symbol,
            period: query.period || '5m',
            limit: query.limit || 30
        });
    }, {
        query: t.Object({
            symbol: t.String(),
            period: t.Optional(t.String()),
            limit: t.Optional(t.Numeric())
        })
    })
    .get('/klines', async ({ query, set }) => {
        set.headers = getHeaders();
        return fetchBinance('/fapi/v1/klines', {
            symbol: query.symbol,
            interval: query.interval || '5m',
            limit: query.limit || 100
        });
    }, {
        query: t.Object({
            symbol: t.String(),
            interval: t.Optional(t.String()),
            limit: t.Optional(t.Numeric())
        })
    });

console.log('Binance API Loaded');
export default {
    fetch: app.fetch
};
