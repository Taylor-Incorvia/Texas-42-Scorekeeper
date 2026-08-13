<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: { type: Number, required: true },
})

// Marks are drawn the way they'd be drawn on the paper this replaces: gates of
// five, four uprights struck through by a diagonal.
const groups = computed(() => {
  const full = Math.floor(props.count / 5)
  const remainder = props.count % 5
  const result = Array.from({ length: full }, () => 5)
  if (remainder) result.push(remainder)
  return result
})

const UPRIGHT_X = [3, 10, 17, 24]
</script>

<template>
  <div class="flex h-6 items-center gap-1.5">
    <svg
      v-for="(size, index) in groups"
      :key="index"
      viewBox="0 0 28 24"
      class="h-6 w-7 overflow-visible"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    >
      <line
        v-for="x in UPRIGHT_X.slice(0, Math.min(size, 4))"
        :key="x"
        :x1="x"
        y1="2"
        :x2="x"
        y2="22"
      />
      <line v-if="size === 5" x1="-1" y1="21" x2="28" y2="3" />
    </svg>
    <span v-if="count === 0" class="text-sm text-white/20">—</span>
  </div>
</template>
