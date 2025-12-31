```markdown
# Scalping Hunter — AGENTS.md

## 0) Ringkasan Proyek
Bangun website “Scalping Hunter” untuk membantu analisa scalping Futures Binance (data realtime), memakai:
- Frontend: SvelteKit + TypeScript
- Backend API: ElysiaJS (serverless API di Vercel), runtime Bun
- Package manager/runtime lokal: Bun
- Deploy: 1x deploy ke Vercel (1 repo, 1 project)

Halaman utama menampilkan 3 tabel sejajar (3 “scanner mode”) + scoring.
Setiap tabel berisi kandidat pair + arah (short/long/both) + alasan + metrik ringkas.
Klik row -> halaman detail pair + chart + panel indikator + “why score”.

⚠️ Non-goals (jangan dibangun):
- Auto-trading / eksekusi order
- Sinyal “pasti profit”
- Penyimpanan data jangka panjang (tanpa DB dulu)

## 1) Kenapa arsitekturnya begini (penting)
Vercel Functions bersifat stateless dan tidak cocok untuk koneksi WebSocket jangka panjang.
Karena itu:
- Realtime stream Binance Futures dilakukan langsung dari browser (client).
- Backend Elysia di Vercel hanya:
  - proxy REST Binance (hindari CORS),
  - caching ringan,
  - normalisasi response,
  - rate-limit & allowlist endpoint.

## 2) 3 Kondisi Scanner (inti fitur)
### (1) Pump 5m → Sideways → “Short Readiness”
Target: pair yang naik signifikan (5m) lalu mulai konsolidasi/sideways.
Cari timing short dengan konfirmasi tambahan (LSR, funding, OI, RSI/divergence, BB squeeze).

Output tabel:
- Symbol
- Score (0–100)
- Bias: Short
- Pump% (5m/15m), BB width, RSI(5m), Funding, LSR, OIΔ, “trigger note”

### (2) Strong Trend + Volatile → Pullback/Correction → “Trend Continuation Entry”
Target: pair trending kuat (naik/turun) dengan volatilitas cukup, lalu koreksi.
Masuk mengikuti trend ketika koreksi selesai (continuation).

Output tabel:
- Symbol
- Score
- Bias: Long atau Short (ikut trend)
- Trend strength (EMA slope/ADX proxy), Pullback depth, “reclaim” signal, volume behavior

### (3) Volatility Squeeze → Breakout (Long/Short)
Target: pair yang volatilitasnya mengerut (range makin sempit) lalu breakout tegas.
Entry cepat searah breakout; invalidation jelas (balik ke dalam range).

Output tabel:
- Symbol
- Score
- Bias: Both (tergantung breakout)
- Squeeze depth, Range high/low, Breakout confirmation, Volume spike, OIΔ

## 3) Sumber Data Binance (wajib)
### 3.1 WebSocket (langsung dari browser)
Gunakan Futures WS:
- Base: wss://fstream.binance.com
- Tujuan minimal:
  1) Monitor semua: `!miniTicker@arr` atau `!ticker@arr` (pilih salah satu sesuai kebutuhan payload)
  2) Subscribe kline hanya untuk kandidat teratas (top N) agar hemat koneksi:
     - `btcusdt@kline_1m`
     - `btcusdt@kline_5m`
     - `btcusdt@kline_15m`
     - `btcusdt@kline_1h`
  3) (Opsional) mark price stream:
     - `btcusdt@markPrice@1s`

Aturan implementasi:
- Jangan subscribe ratusan stream kline sekaligus. Start dari “universe” (ticker array), lalu pilih top N berdasarkan “pre-score” (volume & change).
- Buat reconnect dengan exponential backoff.
- Gunakan throttling UI update (misal 250–500ms) agar tidak membunuh render.

### 3.2 REST (via proxy Elysia di Vercel)
Minimal endpoint yang dipakai scoring:
- Global/Top Long-Short Ratio (account ratio) untuk period tertentu
- Open Interest history (OI delta)
- Funding rate (current/last)

Catatan:
- Semua request REST dilakukan ke `/api/binance/*` (proxy) untuk hindari CORS & kontrol rate limit.

## 4) Struktur Repo (1 project Vercel)
```

/
api/
binance.ts                # Elysia app export default (Vercel Function)
src/
lib/
binance/
ws.ts                 # client WS manager + multiplex
rest.ts               # fetch ke /api/binance
indicators/             # EMA, RSI, ATR, BBWidth, range, dll (pure TS)
scoring/
types.ts
config.ts             # weights & thresholds (bisa di-tuning)
mode1_pump_sideways.ts
mode2_trend_pullback.ts
mode3_squeeze_breakout.ts
index.ts              # compute all scores
stores/
market.ts             # Svelte store/state (symbols map)
ui/
Table.svelte
ScoreBadge.svelte
Sparkline.svelte
routes/
+layout.svelte
+page.svelte            # 3 tabel sejajar
symbol/[symbol]/+page.svelte   # detail view
static/
svelte.config.js
vercel.json
package.json
bun.lockb

````

## 5) Setup Proyek (Bun + SvelteKit)
Gunakan Svelte CLI:
- Scaffold:
  - `bunx sv create scalping-hunter`
  - pilih TypeScript, ESLint, Prettier
- Masuk folder, install:
  - `cd scalping-hunter`
  - `bun install`

Tambahkan adapter Vercel:
- `bun add -d @sveltejs/adapter-vercel`
- Update `svelte.config.js` pakai adapter vercel.

Tambahkan chart library (pilih 1):
- Rekomendasi: `lightweight-charts`
  - `bun add lightweight-charts`

## 6) Deploy ke Vercel (sekali deploy)
### 6.1 vercel.json
Buat `vercel.json`:
- set Bun runtime (bunVersion)
- (opsional) konfigurasi function duration default

Contoh minimal:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x"
}
````

### 6.2 Scripts

Pastikan `package.json`:

* `dev`: sveltekit dev
* `build`: build sveltekit
* `preview`: preview
* `lint`, `format`
  Gunakan bun untuk run:
* `bun run dev`
* `bun run build`

### 6.3 Local dev meniru Vercel

Gunakan Vercel CLI:

* `bunx vercel dev`
  Ini harus menjalankan SvelteKit + folder `api/` Functions sekaligus.

## 7) Backend API (Elysia di /api/binance.ts)

Buat Elysia app sebagai default export (tanpa listen).
Tujuan: proxy REST Binance + caching ringan.

Routing yang disediakan:

* GET `/api/binance/funding?symbol=BTCUSDT`
* GET `/api/binance/lsr?symbol=BTCUSDT&period=5m&limit=30`
* GET `/api/binance/oi?symbol=BTCUSDT&period=5m&limit=30`

Rules:

* Allowlist: hanya route di atas.
* Validasi query (symbol uppercase, whitelist chars A-Z0-9).
* Set header caching:

  * `Cache-Control: s-maxage=1, stale-while-revalidate=2` (atau sesuai kebutuhan)
* Tambahkan guard rate limit sederhana per IP (best-effort).
* Return JSON kecil & konsisten.

## 8) Scoring Engine (0–100)

Semua mode:

* Gunakan “features” (0..1) lalu weighted sum.
* Score final = round(100 * clamp01(weightedSum)).

### 8.1 Mode 1: Pump → Sideways → Short readiness

Features:

* pumpStrength: % change 5m & 15m (semakin tinggi semakin mendekati 1)
* sidewaysTightness: BB width kecil / ATR menurun (semakin kecil semakin 1)
* exhaustion: RSI tinggi + divergence proxy (opsional)
* positioning: LSR condong long (extreme long -> 1 untuk short readiness)
* funding: funding positif tinggi (-> 1 untuk short readiness)
* oiBuildUp: OI naik tapi harga stagnan (-> 1)

Output “Trigger note” (string singkat):

* “Pump kuat + squeeze + LSR long heavy”
* “Funding tinggi + OI naik, harga mandek”

### 8.2 Mode 2: Trend + Pullback (continuation)

Features:

* trendStrength: EMA(50/200) alignment + slope (TF 15m/1h)
* pullbackQuality: retrace ke EMA(21/50) tanpa breakdown struktur
* volatility: ATR cukup (scalp butuh gerak)
* confirmation: reclaim candle / momentum balik (proxy dari close vs high/low)

Bias:

* Long jika trend up, Short jika trend down.

### 8.3 Mode 3: Squeeze → Breakout

Features:

* squeezeDepth: BB width percentile rendah (kecil -> 1)
* rangeClean: range jelas (low noise) -> 1
* breakoutImpulse: close menembus range + body besar -> 1
* volumeSpike: volume naik signifikan -> 1
* oiConfirm: OIΔ positif saat breakout -> 1

Bias:

* Both (tunggu breakout). Di tabel tunjukkan “break above X / break below Y”.

## 9) UI/UX Wajib

Halaman utama:

* Layout grid 3 kolom (desktop), stack (mobile).
* Masing-masing tabel:

  * Search symbol
  * Sort by score (default desc)
  * Badge bias (Short/Long/Both)
  * Update timestamp + status koneksi WS

Klik row:

* /symbol/[symbol]
* Candlestick chart (1m/5m switch)
* Overlay indikator: EMA, BB, RSI (panel)
* Panel “Kenapa score tinggi” (list feature contribution)

## 10) Performance & Reliability

* Simpan state market sebagai Map(symbol -> struct).
* UI update ter-throttle (requestAnimationFrame atau setInterval 250ms).
* Kline buffer: simpan max 300 candle per TF per symbol (ring buffer).
* Reconnect WS:

  * backoff: 0.5s, 1s, 2s, 5s, max 15s
  * resubscribe active streams

## 11) Security & Compliance

* Tampilkan banner:

  * “Educational tools, not financial advice.”
* Jangan simpan API keys user.
* Jangan klaim akurasi prediksi.

## 12) Definition of Done (DoD)

* Vercel deploy sukses (frontend + /api/binance/* berjalan).
* Halaman utama menampilkan 3 tabel sejajar + scoring realtime.
* Klik symbol membuka detail chart.
* WS reconnect bekerja.
* Proxy REST tidak error CORS dan punya caching header.
* Minimal 1 unit test untuk scoring normalization.

## 13) Milestone Delivery Order

1. Scaffold SvelteKit + adapter-vercel + layout 3 kolom
2. WS manager: ticker universe + select top N
3. Kline subscription untuk top N (1m/5m dulu)
4. Implement indikator core (EMA, RSI, ATR, BB width)
5. Implement scoring mode 1/2/3
6. Elysia proxy endpoints (funding/lsr/oi)
7. Detail page + chart
8. Polish: sort/search/filter, reconnect, caching, tests