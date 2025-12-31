import { type Ticker } from '../types';

type TickerCallback = (tickers: Ticker[]) => void;
type KlineCallback = (symbol: string, kline: any, interval: string) => void;

export class BinanceWS {
    private ws: WebSocket | null = null;
    private baseUrl = 'wss://fstream.binance.com/ws';
    private reconnectDelay = 500;
    private maxReconnectDelay = 15000;
    private subscriptions: Set<string> = new Set();

    constructor(
        private onTicker: TickerCallback,
        private onKline: KlineCallback
    ) { }

    connect() {
        // !ticker@arr gives us P (percent change) which we need
        const streams = ['!ticker@arr', ...this.subscriptions];
        // Note: For combined streams, use /stream?streams=...
        const url = `wss://fstream.binance.com/stream?streams=${streams.join('/')}`;

        console.log('Connecting to Binance WS:', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('Binance WS Connected');
            this.reconnectDelay = 500;
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle combined stream payload: { stream: '...', data: ... }
                if (data.stream === '!ticker@arr') {
                    this.onTicker(data.data);
                } else if (data.stream && data.stream.includes('@kline')) {
                    // stream: btcusdt@kline_5m
                    const parts = data.stream.split('@');
                    const symbol = parts[0].toUpperCase();
                    const interval = parts[1].split('_')[1]; // kline_5m -> 5m
                    this.onKline(symbol, data.data.k, interval);
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        this.ws.onclose = () => {
            console.log('Binance WS Closed, reconnecting...');
            this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
            console.error('Binance WS Error', err);
            this.ws?.close();
        };
    }

    subscribeKline(symbol: string, interval: string) {
        const stream = `${symbol.toLowerCase()}@kline_${interval}`;
        if (this.subscriptions.has(stream)) return;

        this.subscriptions.add(stream);
        this.sendSubscribe([stream]);
    }

    private sendSubscribe(streams: string[]) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                method: 'SUBSCRIBE',
                params: streams,
                id: Date.now()
            }));
        }
    }

    private scheduleReconnect() {
        setTimeout(() => {
            this.connect();
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        }, this.reconnectDelay);
    }
}
