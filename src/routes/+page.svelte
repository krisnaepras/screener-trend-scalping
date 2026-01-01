<script lang="ts">
	import { market } from '$lib/stores/market';
	import Table from '$lib/ui/Table.svelte';
	import type { MarketState } from '$lib/types';

	// Derived filtered lists
	// We update these reactively based on $market

	let mode1Data: MarketState[] = [];
	let mode2Data: MarketState[] = [];
	let mode3Data: MarketState[] = [];

	let activeTab: 'mode1' | 'mode2' | 'mode3' = 'mode1';
	$: {
		const all = Array.from($market.values());

		// Mode 1: High Score Descending
		mode1Data = all
			.filter((m) => m.scoreMode1 > 0 || m.volume > 0) // Show everything available
			.sort((a, b) => b.scoreMode1 - a.scoreMode1)
			.slice(0, 50);

		// Mode 2: High Score
		mode2Data = all
			.filter((m) => m.scoreMode2 > 0 || m.volume > 0)
			.sort((a, b) => b.scoreMode2 - a.scoreMode2)
			.slice(0, 50);

		// Mode 3: High Score
		mode3Data = all
			.filter((m) => m.scoreMode3 > 0 || m.volume > 0)
			.sort((a, b) => b.scoreMode3 - a.scoreMode3)
			.slice(0, 50);
	}
</script>

<div class="flex flex-col h-[calc(100vh-8rem)] gap-4">
	<!-- Mobile Tabs -->
	<div class="flex lg:hidden bg-surface-900_90 border border-white/5 rounded-lg p-1">
		<button
			class="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all
        {activeTab === 'mode1'
				? 'bg-brand-500/20 text-brand-400 shadow-sm'
				: 'text-slate-500 hover:text-slate-300'}"
			on:click={() => (activeTab = 'mode1')}
		>
			Pump/Rev
		</button>
		<button
			class="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all
        {activeTab === 'mode2'
				? 'bg-brand-500/20 text-brand-400 shadow-sm'
				: 'text-slate-500 hover:text-slate-300'}"
			on:click={() => (activeTab = 'mode2')}
		>
			Trend
		</button>
		<button
			class="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all
        {activeTab === 'mode3'
				? 'bg-brand-500/20 text-brand-400 shadow-sm'
				: 'text-slate-500 hover:text-slate-300'}"
			on:click={() => (activeTab = 'mode3')}
		>
			Squeeze
		</button>
	</div>

	<!-- Content Grid -->
	<div class="flex-1 lg:grid lg:grid-cols-3 gap-6 min-h-0">
		<!-- Mode 1: Pump & Exhaustion -->
		<div class="h-full {activeTab === 'mode1' ? 'block' : 'hidden'} lg:block">
			<Table title="Pump & Reversal" data={mode1Data} scoreKey="scoreMode1" />
		</div>

		<!-- Mode 2: Trend & Pullback -->
		<div class="h-full {activeTab === 'mode2' ? 'block' : 'hidden'} lg:block">
			<Table title="Trend Continuation" data={mode2Data} scoreKey="scoreMode2" />
		</div>

		<!-- Mode 3: Squeeze & Breakout -->
		<div class="h-full {activeTab === 'mode3' ? 'block' : 'hidden'} lg:block">
			<Table title="Squeeze & Breakout" data={mode3Data} scoreKey="scoreMode3" />
		</div>
	</div>
</div>
