const adapter = process.env.ADAPTER === 'static'
	? (await import('@sveltejs/adapter-static')).default
	: (await import('@sveltejs/adapter-vercel')).default;
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: process.env.ADAPTER === 'static'
			? adapter({
				fallback: 'index.html'
			})
			: adapter()
	}
};

export default config;
