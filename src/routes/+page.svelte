<script lang="ts">
	import { market } from '$lib/stores/market';
	import Table from '$lib/ui/Table.svelte';
	import type { MarketState } from '$lib/types';

	// Derived filtered lists
	// We update these reactively based on $market

	let mode1Data: MarketState[] = [];
	let mode2Data: MarketState[] = [];
	let mode3Data: MarketState[] = [];

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

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
	<!-- Mode 1: Pump & Exhaustion -->
	<div class="h-full min-h-[500px]">
		<Table title="Pump & Reversal Ready" data={mode1Data} scoreKey="scoreMode1" />
	</div>

	<!-- Mode 2: Trend & Pullback -->
	<div class="h-full min-h-[500px]">
		<Table title="Trend Continuation" data={mode2Data} scoreKey="scoreMode2" />
	</div>

	<!-- Mode 3: Squeeze & Breakout -->
	<div class="h-full min-h-[500px]">
		<Table title="Squeeze & Breakout" data={mode3Data} scoreKey="scoreMode3" />
	</div>
</div>
