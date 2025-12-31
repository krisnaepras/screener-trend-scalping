import { Elysia } from 'elysia';
import app from '../api/binance';

// Check if app is default export or has fetch property
// Based on previous edits, we exported { fetch: ... } for Vercel.
// For local, we need to wrap it back or just use the routes if we can import them.
// Actually, `app` in api/binance.ts is likely the object { fetch: ... } now.
// We need the original Elysia instance or we can just reconstruct a runner.

// Let's inspect what we can import. 
// If api/binance.ts exports { fetch }, it's hard to attach to Bun.serve directly without the app instance.
// But wait, Bun.serve({ fetch: imported.fetch }) works!

console.log('Starting Local API Server on port 3001...');

const server = Bun.serve({
    port: 3000,
    fetch: app.fetch
});

console.log(`Local API listening on ${server.url}`);
