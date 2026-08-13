<script setup>
defineProps({
  team: { type: Number, required: true },
  teamNames: { type: Array, required: true },
  scores: { type: Array, required: true },
})

const emit = defineEmits(['rematch', 'undo'])
</script>

<template>
  <div
    class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-felt/90 px-6 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center gap-2 text-center">
      <span class="text-[0.7rem] uppercase tracking-[0.3em] text-white/40">Game</span>
      <h2
        class="text-3xl font-bold leading-tight"
        :class="team === 0 ? 'text-amber-300' : 'text-sky-300'"
      >
        {{ teamNames[team] }}
      </h2>
      <p class="text-lg font-semibold tabular-nums text-white/70">
        {{ scores[team] }} &ndash; {{ scores[team === 0 ? 1 : 0] }}
      </p>
    </div>

    <div class="flex w-full max-w-xs flex-col gap-2">
      <button
        type="button"
        class="rounded-2xl bg-white py-3.5 text-base font-semibold text-felt transition-transform active:scale-[0.98]"
        @click="emit('rematch')"
      >
        Rematch
      </button>
      <button
        type="button"
        class="rounded-2xl border border-white/10 py-3 text-sm font-medium text-white/50 transition-transform active:scale-[0.98]"
        @click="emit('undo')"
      >
        Undo last score
      </button>
    </div>
  </div>
</template>
