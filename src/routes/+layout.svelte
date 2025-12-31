<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { market } from '$lib/stores/market';

	onMount(() => {
		market.init();
	});
</script>

<div class="min-h-screen bg-gray-100 font-sans text-gray-900">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<a
					href="/"
					class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
				>
					Scalping Hunter
				</a>
			</div>
			<div class="text-xs text-gray-500">Educational Tool. Not Financial Advice.</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
</div>
