<script setup lang="ts">
import { computed } from 'vue'
import ScoreBoard from './components/ScoreBoard.vue'
import ShakerWheel from './components/ShakerWheel.vue'
import HandEntry from './components/HandEntry.vue'
import SetupPanel from './components/SetupPanel.vue'
import WinnerOverlay from './components/WinnerOverlay.vue'
import { useGame } from './composables/useGame'
import { useWakeLock } from './composables/useWakeLock'

const {
  names,
  rawNames,
  teamNames,
  started,
  turns,
  shaker,
  scores,
  winner,
  canUndo,
  pendingBid,
  setName,
  startWith,
  startRandom,
  recordRound,
  undo,
  rematch,
  reset,
} = useGame()

// iOS can only take the lock once the player has tapped something, so this
// starts out false and clears itself the moment the board is touched.
const { active: screenAwake } = useWakeLock()

const shakerName = computed(() => names.value[shaker.value])

function confirmReset(): void {
  if (!canUndo.value || confirm('Start a new game? The current score will be cleared.')) {
    reset()
  }
}
</script>

<template>
  <div class="relative mx-auto flex h-full max-w-md flex-col px-4 pb-[env(safe-area-inset-bottom)]">
    <header class="flex items-center justify-between pb-2 pt-3">
      <div class="flex items-baseline gap-2">
        <h1 class="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white/30">42</h1>
        <span v-if="!screenAwake" class="text-[0.6rem] text-white/25">screen may sleep</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          :class="canUndo ? 'text-white/60 active:bg-white/10' : 'text-white/15'"
          :disabled="!canUndo"
          @click="undo"
        >
          &#8634; Undo
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-medium text-white/40 transition-colors active:bg-white/10"
          @click="confirmReset"
        >
          New game
        </button>
      </div>
    </header>

    <ScoreBoard :team-names="teamNames" :scores="scores" />

    <main class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-2">
      <ShakerWheel
        :names="names"
        :raw-names="rawNames"
        :shaker="shaker"
        :turns="turns"
        :started="started"
        @rename="setName"
      />
      <p v-if="started" class="text-sm text-white/50">
        <span class="font-semibold text-white">{{ shakerName }}</span> shakes
      </p>
    </main>

    <footer class="pb-4">
      <SetupPanel v-if="!started" :names="names" @start="startWith" @shuffle="startRandom" />
      <HandEntry
        v-else
        v-model:bid="pendingBid"
        :team-names="teamNames"
        :shaker-name="shakerName"
        @record="recordRound"
      />
    </footer>

    <WinnerOverlay
      v-if="winner !== null"
      :team="winner"
      :team-names="teamNames"
      :scores="scores"
      @rematch="rematch"
      @undo="undo"
    />
  </div>
</template>
