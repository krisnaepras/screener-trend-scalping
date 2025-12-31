<script lang="ts">
    export let score: number;
    
    // Color scale based on score
    // 0-50: Gray/Neutral
    // 50-70: Light Green/Red depending on context (handled by parent logic? No, usually high score = good signal)
    // 70-100: Bright Color
    
    function getColor(s: number) {
        if (s >= 80) return 'bg-green-600 text-white';
        if (s >= 60) return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-500';
    }
</script>

<div class="px-2 py-1 rounded font-bold text-sm {getColor(score)} inline-block">
    {score}
</div>
