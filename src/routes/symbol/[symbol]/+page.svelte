<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { market } from '$lib/stores/market';
	import { createChart, ColorType } from 'lightweight-charts';
	import ScoreBadge from '$lib/ui/ScoreBadge.svelte';

	const symbol = $page.params.symbol ?? '';

	let chartContainer: HTMLDivElement;
	let chart: any;
	let candlestickSeries: any;

	// Reactive state from market
	$: state = $market.get(symbol);
	$: if (symbol) startSubscribe(symbol);

	function startSubscribe(s: string) {
		// Ensure we subscribe to klines for this symbol
		market.subscribeToSymbol(s);
	}

	// Chart update logic
	$: if (chart && candlestickSeries && state && state.klines5m.length > 0) {
		const data = state.klines5m.map((k) => ({
			time: k.t / 1000,
			open: k.o,
			high: k.h,
			low: k.l,
			close: k.c
		}));

		// Optimize: setDatas mostly for init, update for latest.
		candlestickSeries.setData(data);
	}

	onMount(() => {
		if (!chartContainer) return;

		chart = createChart(chartContainer, {
			layout: {
				background: { type: ColorType.Solid, color: '#0f172a' }, // surface-900
				textColor: '#94a3b8' // slate-400
			},
			grid: {
				vertLines: { color: '#1e293b' }, // surface-800
				horzLines: { color: '#1e293b' }
			},
			width: chartContainer.clientWidth,
			height: 400
		});

		candlestickSeries = chart.addCandlestickSeries({
			upColor: '#22c55e', // trade-up
			downColor: '#ef4444', // trade-down
			borderVisible: false,
			wickUpColor: '#22c55e',
			wickDownColor: '#ef4444'
		});

		const handleResize = () => {
			chart.applyOptions({ width: chartContainer.clientWidth });
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	onDestroy(() => {
		if (chart) chart.remove();
	});
</script>

<div class="space-y-6">
	<!-- Header Card -->
	<div
		class="flex flex-col md:flex-row md:items-center justify-between bg-surface-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-xl shadow-lg relative overflow-hidden"
	>
		<!-- Background Glow -->
		<div
			class="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"
		></div>

		<div class="relative z-10 mb-4 md:mb-0">
			<h1
				class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-sans tracking-tight"
			>
				{symbol}
			</h1>
			<div class="flex items-baseline gap-4 mt-1">
				{#if state}
					<span class="text-3xl font-mono text-slate-100">{state.price}</span>
					<span
						class="{state.change24h >= 0
							? 'text-trade-up drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]'
							: 'text-trade-down drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'} font-mono font-bold text-lg"
					>
						{state.change24h > 0 ? '+' : ''}{state.change24h.toFixed(2)}%
					</span>
				{:else}
					<span class="text-slate-500 text-sm animate-pulse">Initializing feed...</span>
				{/if}
			</div>
		</div>

		{#if state}
			<div class="flex flex-wrap gap-6 relative z-10">
				<div class="flex flex-col items-center">
					<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
						Bias
					</div>
					<div
						class="font-bold text-sm px-3 py-1 bg-surface-800 rounded border border-white/5
						{state.bias === 'LONG'
							? 'text-trade-up shadow-lg shadow-trade-up/10'
							: state.bias === 'SHORT'
								? 'text-trade-down shadow-lg shadow-trade-down/10'
								: 'text-slate-400'}"
					>
						{state.bias}
					</div>
				</div>
				<div class="flex flex-col items-center">
					<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
						Pump
					</div>
					<ScoreBadge score={state.scoreMode1} />
				</div>
				<div class="flex flex-col items-center">
					<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
						Trend
					</div>
					<ScoreBadge score={state.scoreMode2} />
				</div>
				<div class="flex flex-col items-center">
					<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
						Squeeze
					</div>
					<ScoreBadge score={state.scoreMode3} />
				</div>
			</div>
		{/if}
	</div>

	<!-- Chart -->
	<div
		class="bg-surface-900 border border-white/5 p-1 rounded-xl shadow-2xl relative overflow-hidden group"
	>
		<div
			bind:this={chartContainer}
			class="w-full h-[500px] rounded-lg overflow-hidden opacity-90 transition-opacity group-hover:opacity-100"
		></div>
		{#if !state}
			<div
				class="absolute inset-0 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm z-20"
			>
				<div class="animate-pulse text-slate-500 text-sm font-mono">Loading Chart Data...</div>
			</div>
		{/if}
	</div>

	<!-- Stats Grid -->
	{#if state}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div
				class="bg-surface-900/50 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg"
			>
				<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
					RSI (5m)
				</div>
				<div class="text-2xl font-mono text-slate-200">
					{state.rsi5m ? state.rsi5m.toFixed(2) : '-'}
				</div>
			</div>
			<div
				class="bg-surface-900/50 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg"
			>
				<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
					BB Width
				</div>
				<div class="text-2xl font-mono text-slate-200">
					{state.bbWidth ? (state.bbWidth * 100).toFixed(2) + '%' : '-'}
				</div>
			</div>
			<div
				class="bg-surface-900/50 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg"
			>
				<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
					Volume (24h)
				</div>
				<div class="text-2xl font-mono text-slate-200">
					{(state.volume / 1000000).toFixed(2)}M
				</div>
			</div>
			<div
				class="bg-surface-900/50 backdrop-blur-sm border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden"
			>
				<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
					System Note
				</div>
				<div class="text-sm text-slate-300 relative z-10 font-medium">
					{state.note || '-'}
				</div>
				<!-- Subtle accent line on right -->
				<div class="absolute right-0 top-0 bottom-0 w-1 bg-brand-500 opacity-50"></div>
			</div>
		</div>
	{/if}
</div>
