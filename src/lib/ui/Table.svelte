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

<div class="border rounded-lg p-4 bg-white shadow-sm h-full flex flex-col">
	<div class="flex items-center justify-between mb-4 border-b pb-2">
		<h2 class="text-xl font-bold">{title}</h2>
		<input
			type="text"
			placeholder="Search..."
			bind:value={searchQuery}
			class="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
		/>
	</div>

	<div class="overflow-y-auto flex-1">
		<table class="w-full text-sm">
			<thead class="text-xs text-gray-500 bg-gray-50 sticky top-0">
				<tr>
					<th class="p-2 text-left">Symbol</th>
					<th class="p-2 text-left">Price</th>
					<th class="p-2 text-center">Score</th>
					<th class="p-2 text-right">Trend</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each filteredData as item}
					<tr
						class="hover:bg-gray-50 cursor-pointer"
						on:click={() => (window.location.href = `/symbol/${item.symbol}`)}
					>
						<td class="p-2">
							<div class="font-bold">{item.symbol}</div>
							<div class="text-xs text-gray-400">{item.bias}</div>
						</td>
						<td class="p-2">
							<div>{item.price.toFixed(item.price < 1 ? 4 : 2)}</div>
							<div class="{item.change24h >= 0 ? 'text-green-600' : 'text-red-600'} text-xs">
								{item.change24h.toFixed(2)}%
							</div>
						</td>
						<td class="p-2 text-center">
							<ScoreBadge score={item[scoreKey]} />
						</td>
						<td class="p-2 text-right">
							<!-- Using closes for sparkline if available -->
							{#if item.klines5m.length > 5}
								<Sparkline
									data={item.klines5m.slice(-20).map((k) => k.c)}
									color={item.change24h >= 0 ? '#16a34a' : '#dc2626'}
								/>
							{/if}
						</td>
					</tr>
				{/each}
				{#if data.length === 0}
					<tr>
						<td colspan="4" class="p-4 text-center text-gray-400">Waiting for data...</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
