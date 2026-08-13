<script setup lang="ts">
import TallyMarks from './TallyMarks.vue'
import { TARGET_MARKS, type ByTeam, type Team } from '../composables/useGame'

defineProps<{
  teamNames: ByTeam<string>
  scores: ByTeam<number>
}>()

const TEAMS: readonly Team[] = [0, 1]
</script>

<template>
  <div class="flex items-stretch gap-2">
    <div
      v-for="team in TEAMS"
      :key="team"
      class="flex flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-3"
      :class="
        team === 0
          ? 'border-amber-400/25 bg-amber-400/[0.07] text-amber-300'
          : 'border-sky-400/25 bg-sky-400/[0.07] text-sky-300'
      "
    >
      <span class="truncate text-xs font-medium opacity-70">{{ teamNames[team] }}</span>
      <span class="text-4xl font-bold leading-none tabular-nums text-white">
        {{ scores[team] }}
      </span>
      <TallyMarks :count="scores[team]" />
    </div>
  </div>
  <p class="mt-1.5 text-center text-[0.65rem] uppercase tracking-[0.2em] text-white/25">
    {{ TARGET_MARKS }} marks wins
  </p>
</template>
