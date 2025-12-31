<script lang="ts">
	export let data: number[] = [];
	export let color = 'green';

	// Simple SVG sparkline
	const height = 30;
	const width = 100;

	$: points = data
		.map((val, i) => {
			const x = (i / (data.length - 1)) * width;
			// Normalize y to 0-height
			const min = Math.min(...data);
			const max = Math.max(...data);
			const range = max - min || 1;
			const y = height - ((val - min) / range) * height;
			return `${x},${y}`;
		})
		.join(' ');
</script>

<svg {width} {height} class="overflow-visible">
	<polyline fill="none" stroke={color} stroke-width="1.5" {points} />
</svg>
