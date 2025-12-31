<script lang="ts">
	export let score: number;

	// Color scale based on score
	// 0-50: Gray/Neutral
	// 50-70: Light Green/Red depending on context (handled by parent logic? No, usually high score = good signal)
	// 70-100: Bright Color

	function getColor(s: number) {
		if (s >= 80)
			return 'bg-trade-up/20 text-trade-up border-trade-up/30 shadow-lg shadow-trade-up/20';
		if (s >= 60) return 'bg-brand-500/20 text-brand-400 border-brand-500/30';
		if (s >= 40) return 'bg-slate-700/30 text-slate-400 border-slate-700/30';
		return 'bg-slate-800/50 text-slate-600 border-slate-800/50';
	}
</script>

<div
	class="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border backdrop-blur-sm transition-all duration-300 {getColor(
		score
	)}"
>
	{score}
</div>
