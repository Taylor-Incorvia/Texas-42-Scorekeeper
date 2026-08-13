<script setup lang="ts">
import { ref } from 'vue'
import { MAX_MARKS_PER_HAND, type ByTeam, type Team } from '../composables/useGame'

defineProps<{
  teamNames: ByTeam<string>
  shakerName: string
}>()

const emit = defineEmits<{
  record: [team: Team | null, marks: number]
}>()

const marks = ref(1)
const markOptions: number[] = Array.from({ length: MAX_MARKS_PER_HAND }, (_, i) => i + 1)
const TEAMS: readonly Team[] = [0, 1]

function award(team: Team): void {
  emit('record', team, marks.value)
  // Snap back to 1 so a big bid last round can't silently inflate the next one.
  marks.value = 1
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <span class="text-[0.65rem] font-medium uppercase tracking-widest text-white/40">
        Marks won
      </span>
      <div class="flex flex-1 gap-1.5 rounded-xl bg-white/5 p-1">
        <button
          v-for="option in markOptions"
          :key="option"
          type="button"
          class="flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors"
          :class="marks === option ? 'bg-white text-felt' : 'text-white/50 active:bg-white/10'"
          @click="marks = option"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        v-for="team in TEAMS"
        :key="team"
        type="button"
        class="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border px-2 py-3.5 font-semibold transition-transform active:scale-[0.97]"
        :class="
          team === 0
            ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
            : 'border-sky-400/40 bg-sky-400/15 text-sky-200'
        "
        @click="award(team)"
      >
        <span class="text-sm leading-tight">{{ teamNames[team] }}</span>
        <span class="text-[0.65rem] font-medium uppercase tracking-wider opacity-60">
          +{{ marks }} {{ marks === 1 ? 'mark' : 'marks' }}
        </span>
      </button>
    </div>

    <button
      type="button"
      class="rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/60 transition-transform active:scale-[0.98]"
      @click="emit('record', null, 0)"
    >
      No bid &middot; pass to {{ shakerName }}'s left
    </button>
  </div>
</template>
