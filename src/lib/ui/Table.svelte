<script lang="ts">
	import type { MarketState } from '../types';
	import ScoreBadge from './ScoreBadge.svelte';
	import Sparkline from './Sparkline.svelte';

	export let title: string;
	export let data: MarketState[] = [];
	export let scoreKey: 'scoreMode1' | 'scoreMode2' | 'scoreMode3';

	let searchQuery = '';

	$: filteredData = data.filter((item) => item.symbol.includes(searchQuery.toUpperCase()));
</script>

<div
	class="h-full flex flex-col bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-2xl"
>
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-white/5">
		<h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
			{title}
		</h2>
		<div class="relative">
			<input
				type="text"
				placeholder="Search symbol..."
				bind:value={searchQuery}
				class="w-32 sm:w-48 bg-surface-950/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
			/>
		</div>
	</div>

	<!-- Table Content -->
	<div class="flex-1 overflow-auto custom-scrollbar relative">
		<table class="w-full text-sm">
			<thead class="sticky top-0 z-10 bg-surface-900/95 backdrop-blur-md shadow-sm">
				<tr>
					<th class="p-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
						>Symbol</th
					>
					<th class="p-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
						>Price</th
					>
					<th class="p-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
						>Score</th
					>
					<th
						class="p-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider pr-4"
						>Trend</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-white/5">
				{#each filteredData as item}
					<tr
						class="group hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
						on:click={() => (window.location.href = `/symbol/${item.symbol}`)}
					>
						<!-- Symbol -->
						<td class="p-3 whitespace-nowrap">
							<div class="flex flex-col">
								<span
									class="font-bold text-slate-200 group-hover:text-brand-400 transition-colors font-mono"
								>
									{item.symbol.replace('USDT', '')}
									<span class="text-xs text-slate-600 font-sans ml-0.5">/USDT</span>
								</span>
								<span
									class="text-[10px] uppercase font-bold tracking-wide mt-0.5
									{item.bias === 'LONG'
										? 'text-trade-up'
										: item.bias === 'SHORT'
											? 'text-trade-down'
											: 'text-slate-600'}"
								>
									{item.bias}
								</span>
							</div>
						</td>

						<!-- Price -->
						<td class="p-3 text-right whitespace-nowrap">
							<div class="font-mono text-slate-300">
								{item.price.toFixed(item.price < 1 ? 4 : 2)}
							</div>
							<div
								class="text-xs font-mono font-medium mt-0.5
								{item.change24h > 0 ? 'text-trade-up' : item.change24h < 0 ? 'text-trade-down' : 'text-slate-500'}"
							>
								{item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%
							</div>
						</td>

						<!-- Score -->
						<td class="p-3 flex justify-center items-center h-full">
							<ScoreBadge score={item[scoreKey]} />
						</td>

						<!-- Sparkline (Trend) -->
						<td class="p-3 text-right pl-0 pr-4 w-24">
							{#if item.klines5m.length > 5}
								<div class="h-8 w-20 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
									<Sparkline
										data={item.klines5m.slice(-20).map((k) => k.c)}
										color={item.change24h >= 0 ? '#22c55e' : '#ef4444'}
									/>
								</div>
							{/if}
						</td>
					</tr>
				{/each}
				{#if data.length === 0}
					<tr>
						<td colspan="4" class="p-12 text-center">
							<div class="flex flex-col items-center justify-center text-slate-500 gap-2">
								<div
									class="h-8 w-8 rounded-full border-2 border-slate-700 border-t-brand-500 animate-spin"
								/>
								<span class="text-xs font-mono uppercase tracking-widest animate-pulse"
									>Scanning Market...</span
								>
							</div>
						</td>
					</tr>
				{:else if filteredData.length === 0}
					<tr>
						<td colspan="4" class="p-8 text-center text-slate-500 text-sm italic">
							No symbols found matching "{searchQuery}"
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
