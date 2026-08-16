<script setup lang="ts">
import { computed } from 'vue'
import BidScroller from './BidScroller.vue'
import { PASS, marksForBid, type ByTeam, type Team } from '../composables/useGame'

defineProps<{
  teamNames: ByTeam<string>
  shakerName: string
}>()

const emit = defineEmits<{
  record: [bid: number, team: Team | null]
}>()

const bid = defineModel<number>('bid', { required: true })

const TEAMS: readonly Team[] = [0, 1]

const passed = computed(() => bid.value === PASS)
const marks = computed(() => marksForBid(bid.value))
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <span class="px-1 text-[0.65rem] font-medium uppercase tracking-widest text-white/40">Bid</span>

    <BidScroller v-model="bid" />

    <!-- A passed-out round has no winner to pick, so the two team buttons
         collapse into the single thing that can happen next. -->
    <button
      v-if="passed"
      type="button"
      class="rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-white/60 transition-transform active:scale-[0.98]"
      @click="emit('record', PASS, null)"
    >
      Nobody bid &middot; pass to {{ shakerName }}'s left
    </button>

    <div v-else class="flex gap-2">
      <button
        v-for="team in TEAMS"
        :key="team"
        type="button"
        class="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 font-semibold transition-transform active:scale-[0.97]"
        :class="
          team === 0
            ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
            : 'border-sky-400/40 bg-sky-400/15 text-sky-200'
        "
        @click="emit('record', bid, team)"
      >
        <span class="text-sm leading-tight">{{ teamNames[team] }}</span>
        <span class="text-[0.65rem] font-medium uppercase tracking-wider opacity-60">
          +{{ marks }} {{ marks === 1 ? 'mark' : 'marks' }}
        </span>
      </button>
    </div>
  </div>
</template>
