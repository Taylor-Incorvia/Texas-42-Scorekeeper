<script setup>
import { TEAM_OF_SEAT } from '../composables/useGame.js'

defineProps({
  names: { type: Array, required: true },
})

const emit = defineEmits(['start', 'shuffle'])
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-center text-sm font-medium text-white/70">Who shakes first?</p>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="(name, seat) in names"
        :key="seat"
        type="button"
        class="truncate rounded-2xl border px-3 py-3.5 text-sm font-semibold transition-transform active:scale-[0.97]"
        :class="
          TEAM_OF_SEAT[seat] === 0
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
            : 'border-sky-400/40 bg-sky-400/10 text-sky-200'
        "
        @click="emit('start', seat)"
      >
        {{ name }}
      </button>
    </div>

    <button
      type="button"
      class="rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/60 transition-transform active:scale-[0.98]"
      @click="emit('shuffle')"
    >
      Choose randomly for me
    </button>

    <p class="text-center text-[0.7rem] text-white/30">Tap a name on the table to change it</p>
  </div>
</template>
