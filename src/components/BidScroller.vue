<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue'
import { BID_OPTIONS } from '../composables/useGame'

const bid = defineModel<number>({ required: true })

const track = useTemplateRef<HTMLDivElement>('track')

/**
 * A scroll-snap strip that reports whichever option is nearest the centre line.
 * The value updates continuously as the strip moves rather than waiting for the
 * flick to settle, so the big centred number always matches what's under the
 * marker — the whole point being that the table can glance over and read the
 * current bid off the phone.
 */
let pending = 0
/** Set while we're reacting to our own emit, so the watcher doesn't fight the finger. */
let selfEmitted = false

function items(): HTMLElement[] {
  return track.value ? Array.from(track.value.querySelectorAll<HTMLElement>('[data-bid]')) : []
}

function centreOffset(el: HTMLElement, container: HTMLDivElement): number {
  return el.offsetLeft + el.offsetWidth / 2 - container.clientWidth / 2
}

function nearestIndex(): number {
  const container = track.value
  if (!container) return 0
  const middle = container.scrollLeft + container.clientWidth / 2
  let best = 0
  let bestDistance = Infinity
  items().forEach((item, index) => {
    const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - middle)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}

function onScroll(): void {
  if (pending) return
  pending = requestAnimationFrame(() => {
    pending = 0
    const value = BID_OPTIONS[nearestIndex()]?.value
    if (value !== undefined && value !== bid.value) {
      selfEmitted = true
      bid.value = value
    }
  })
}

function scrollToValue(value: number, behavior: ScrollBehavior): void {
  const container = track.value
  const index = BID_OPTIONS.findIndex((option) => option.value === value)
  const item = items()[index]
  if (!container || !item) return
  container.scrollTo({ left: centreOffset(item, container), behavior })
}

/**
 * Tapping an option is faster than flicking to it when it's already in view.
 * The value is set straight away rather than waiting for the scroll to land on
 * it, so a tap registers even if the strip barely moves.
 */
function select(value: number): void {
  if (value === bid.value) {
    scrollToValue(value, 'smooth')
    return
  }
  bid.value = value // the watcher below brings it to the centre
}

watch(bid, (value) => {
  if (selfEmitted) {
    selfEmitted = false
    return
  }
  scrollToValue(value, 'smooth')
})

onMounted(() => scrollToValue(bid.value, 'auto'))
</script>

<template>
  <div class="relative">
    <!-- Centre marker: a lane the selected option sits in. -->
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-14 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-white/5"
    ></div>

    <div
      ref="track"
      class="scroll-strip relative flex snap-x snap-mandatory overflow-x-auto py-1"
      @scroll="onScroll"
    >
      <!-- Half-width spacers let the first and last options reach the centre. -->
      <div class="w-[calc(50%-2.25rem)] shrink-0"></div>
      <button
        v-for="option in BID_OPTIONS"
        :key="option.value"
        :data-bid="option.value"
        type="button"
        class="flex h-14 w-[4.5rem] shrink-0 snap-center flex-col items-center justify-center rounded-xl transition-colors duration-150"
        :class="
          option.value === bid ? 'text-white' : 'text-white/35 active:text-white/60'
        "
        @click="select(option.value)"
      >
        <span
          class="font-semibold leading-none tabular-nums transition-all duration-150"
          :class="option.value === bid ? 'text-3xl' : 'text-lg'"
        >
          {{ option.label }}
        </span>
        <span
          v-if="option.sub"
          class="mt-0.5 text-[0.55rem] font-medium uppercase tracking-wider opacity-70"
        >
          {{ option.sub }}
        </span>
      </button>
      <div class="w-[calc(50%-2.25rem)] shrink-0"></div>
    </div>

    <!-- Edge fades, so it reads as a strip that keeps going in both directions. -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-felt to-transparent"
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-felt to-transparent"
    ></div>
  </div>
</template>

<style scoped>
/* A visible scrollbar under the numbers makes the strip look like a desktop
   list rather than something you flick. */
.scroll-strip {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.scroll-strip::-webkit-scrollbar {
  display: none;
}
</style>
