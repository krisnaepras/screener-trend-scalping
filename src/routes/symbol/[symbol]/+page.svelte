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
		// But for simplicity in Svelte reactivity, setData is fine for 300 items.
		// Or diff it.
		candlestickSeries.setData(data);
	}

	onMount(() => {
		if (!chartContainer) return;

		chart = createChart(chartContainer, {
			layout: {
				background: { type: ColorType.Solid, color: 'white' },
				textColor: 'black'
			},
			width: chartContainer.clientWidth,
			height: 400,
			grid: {
				vertLines: { color: '#f0f0f0' },
				horzLines: { color: '#f0f0f0' }
			}
		});

		candlestickSeries = chart.addCandlestickSeries({
			upColor: '#26a69a',
			downColor: '#ef5350',
			borderVisible: false,
			wickUpColor: '#26a69a',
			wickDownColor: '#ef5350'
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
	<!-- Header -->
	<div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
		<div>
			<h1 class="text-2xl font-bold">{symbol}</h1>
			<div class="flex items-baseline gap-4">
				{#if state}
					<span class="text-3xl font-mono">{state.price}</span>
					<span class="{state.change24h >= 0 ? 'text-green-600' : 'text-red-600'} font-medium">
						{state.change24h.toFixed(2)}%
					</span>
				{:else}
					<span class="text-gray-400">Loading...</span>
				{/if}
			</div>
		</div>

		{#if state}
			<div class="flex gap-4 text-center">
				<div>
					<div class="text-xs text-gray-500 uppercase">Bias</div>
					<div class="font-bold">{state.bias}</div>
				</div>
				<div>
					<div class="text-xs text-gray-500 uppercase">Mode 1</div>
					<ScoreBadge score={state.scoreMode1} />
				</div>
				<div>
					<div class="text-xs text-gray-500 uppercase">Mode 2</div>
					<ScoreBadge score={state.scoreMode2} />
				</div>
				<div>
					<div class="text-xs text-gray-500 uppercase">Mode 3</div>
					<ScoreBadge score={state.scoreMode3} />
				</div>
			</div>
		{/if}
	</div>

	<!-- Chart -->
	<div class="bg-white p-4 rounded-lg shadow-sm border relative">
		<div bind:this={chartContainer} class="w-full h-[400px]"></div>
	</div>

	<!-- Stats Grid -->
	{#if state}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-white p-4 rounded shadow-sm">
				<div class="text-xs text-gray-500">RSI (5m)</div>
				<div class="text-lg font-mono">{state.rsi5m ? state.rsi5m.toFixed(2) : '-'}</div>
			</div>
			<div class="bg-white p-4 rounded shadow-sm">
				<div class="text-xs text-gray-500">BB Width</div>
				<div class="text-lg font-mono">
					{state.bbWidth ? (state.bbWidth * 100).toFixed(2) + '%' : '-'}
				</div>
			</div>
			<div class="bg-white p-4 rounded shadow-sm">
				<div class="text-xs text-gray-500">Volume (24h)</div>
				<div class="text-lg font-mono">{(state.volume / 1000000).toFixed(2)}M</div>
			</div>
			<div class="bg-white p-4 rounded shadow-sm">
				<div class="text-xs text-gray-500">Note</div>
				<div class="text-sm">{state.note || '-'}</div>
			</div>
		</div>
	{/if}
</div>
