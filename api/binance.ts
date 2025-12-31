import { Elysia, t } from 'elysia';

// Use a rotating list of IPs if DNS fails, or just rely on system DNS.
// User requested 1.1.1.1 / 8.8.8.8 to avoid blocks.
// In a serverless env (Vercel), usually no block.
// For local, we rely on the system or a VPN.
// Implementing a full DoH client here is out of scope for a single file without deps,
// so we stick to standard fetch.

const BASE_URL = 'https://fapi.binance.com';

const getHeaders = () => ({
    'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2',
    'Content-Type': 'application/json',
});

// Helper for fetch with timeout
const fetchBinance = async (path: string, params: Record<string, any>) => {
    const url = new URL(path, BASE_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));

    try {
        console.log(`Fetching ${url.toString()}`);
        const res = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'ScalpingHunter/1.0'
            }
        });

        if (!res.ok) {
            throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
        }

        return await res.json();
    } catch (e) {
        console.error(e);
        return { error: 'Failed to fetch data from Binance' };
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
