<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { market } from '$lib/stores/market';
	import { hunter } from '$lib/stores/hunter';

	onMount(() => {
		market.init();
	});
</script>

<div class="min-h-screen bg-surface-950 font-sans text-slate-200 selection:bg-brand-500/30">
	<!-- Glassmorphism Header -->
	<header
		class="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/5 bg-surface-900/70 backdrop-blur-md flex items-center"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
			<div class="flex items-center gap-3">
				<!-- Animated Logo/Icon wrapper could go here -->
				<div
					class="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20"
				>
					<span class="text-white font-bold text-lg">S</span>
				</div>
				<a
					href="/"
					class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight"
				>
					{#if $hunter === 'intraday'}
						Intraday Hunter
					{:else}
						Scalping Hunter
					{/if}
				</a>
				<div class="ml-4">
					<button
						on:click={() => hunter.toggle()}
						class="px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300
                        {$hunter === 'intraday'
							? 'bg-blue-600 border-blue-400 text-white'
							: 'bg-brand-600 border-brand-400 text-white'}
                        "
					>
						{$hunter === 'intraday' ? '1H / 15m' : '15m / 1m'}
					</button>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<div
					class="hidden sm:block text-xs font-mono text-slate-500 bg-surface-800/50 px-3 py-1 rounded-full border border-white/5"
				>
					LIVE MARKET DATA
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content with top padding for fixed header -->
	<main class="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
		<slot />
	</main>
</div>
