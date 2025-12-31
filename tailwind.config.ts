import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],

    theme: {
        extend: {
            colors: {
                // Dark trading palette
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617', // Main background
                    card: '#1e293b' // Card background
                },
                brand: {
                    400: '#38bdf8', // Light blue accent
                    500: '#0ea5e9', // Primary blue
                    600: '#0284c7',
                    glow: 'rgba(14, 165, 233, 0.5)'
                },
                trade: {
                    up: '#22c55e',
                    down: '#ef4444',
                    upGlow: 'rgba(34, 197, 94, 0.4)',
                    downGlow: 'rgba(239, 68, 68, 0.4)'
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif']
            }
        }
    },

    plugins: []
} satisfies Config;
