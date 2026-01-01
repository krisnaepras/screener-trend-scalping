import { writable } from 'svelte/store';

export type HunterMode = 'scalping' | 'intraday';

function createHunterStore() {
    const { subscribe, set, update } = writable<HunterMode>('scalping');

    return {
        subscribe,
        setMode: (mode: HunterMode) => set(mode),
        toggle: () => update(m => m === 'scalping' ? 'intraday' : 'scalping')
    };
}

export const hunter = createHunterStore();
