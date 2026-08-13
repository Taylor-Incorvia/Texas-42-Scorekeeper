<script setup lang="ts">
import { computed } from 'vue'
import { TEAM_OF_SEAT, type BySeat, type Seat, type Team } from '../composables/useGame'

interface Props {
  /** Resolved display names — falls back to "Player N". */
  names: BySeat<string>
  /** What the user actually typed, so empty seats keep their placeholder. */
  rawNames: BySeat<string>
  shaker: Seat
  turns: number
  started: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  rename: [seat: Seat, value: string]
}>()

interface SeatLayout {
  seat: Seat
  name: string
  team: Team
  left: number
  top: number
}

const SEAT_RADIUS = 36 // % of the wheel's width, measured from the centre

// In screen coordinates y grows downward, so an increasing angle sweeps
// clockwise. Seat 0 sits due south at 90deg and each later seat is a further
// quarter turn clockwise: left, top, right.
const seatAngle = (seat: number): number => 90 + 90 * seat

const seats = computed<SeatLayout[]>(() =>
  props.names.map((name, index) => {
    const seat = index as Seat
    const radians = (seatAngle(seat) * Math.PI) / 180
    return {
      seat,
      name,
      team: TEAM_OF_SEAT[seat],
      left: 50 + SEAT_RADIUS * Math.cos(radians),
      top: 50 + SEAT_RADIUS * Math.sin(radians),
    }
  }),
)

// The hand is drawn pointing east, so it needs the same +90 offset as the
// seats. Driving it off `turns` keeps the rotation monotonic (see useGame).
const handRotation = computed(() => seatAngle(props.turns))

function onRename(seat: Seat, event: Event): void {
  emit('rename', seat, (event.target as HTMLInputElement).value)
}

function blurTarget(event: Event): void {
  ;(event.target as HTMLInputElement).blur()
}
</script>

<template>
  <div class="relative mx-auto aspect-square w-full max-w-[20rem]">
    <!-- table -->
    <div class="absolute inset-[8%] rounded-full border border-white/10 bg-white/[0.03]"></div>
    <div class="absolute inset-[22%] rounded-full border border-white/[0.06]"></div>

    <!-- clock hand -->
    <div
      class="absolute left-1/2 top-1/2 flex h-1.5 w-[27%] origin-left items-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
      :class="started ? 'opacity-100' : 'opacity-0'"
      :style="{ transform: `translateY(-50%) rotate(${handRotation}deg)` }"
    >
      <div class="h-full flex-1 rounded-full bg-gradient-to-r from-white/25 to-white"></div>
      <div
        class="-ml-1 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
      ></div>
    </div>

    <!-- hub -->
    <div
      class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-felt"
    ></div>

    <!-- seats -->
    <div
      v-for="seat in seats"
      :key="seat.seat"
      class="absolute -translate-x-1/2 -translate-y-1/2"
      :style="{ left: `${seat.left}%`, top: `${seat.top}%` }"
    >
      <div
        class="flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-all duration-300"
        :class="[
          started && shaker === seat.seat
            ? seat.team === 0
              ? 'bg-amber-400/15 ring-2 ring-amber-400 scale-105'
              : 'bg-sky-400/15 ring-2 ring-sky-400 scale-105'
            : 'ring-1 ring-white/5',
        ]"
      >
        <input
          :value="rawNames[seat.seat]"
          :placeholder="`Player ${seat.seat + 1}`"
          maxlength="12"
          spellcheck="false"
          autocomplete="off"
          enterkeyhint="done"
          class="w-[5.5rem] bg-transparent text-center text-sm font-semibold outline-none placeholder:font-normal placeholder:text-white/35 focus:placeholder:text-white/20"
          :class="seat.team === 0 ? 'text-amber-200' : 'text-sky-200'"
          @input="onRename(seat.seat, $event)"
          @keydown.enter="blurTarget($event)"
        />
        <span
          class="text-[0.6rem] font-medium uppercase tracking-widest transition-opacity"
          :class="[
            seat.team === 0 ? 'text-amber-400' : 'text-sky-400',
            started && shaker === seat.seat ? 'opacity-100' : 'opacity-0',
          ]"
        >
          shakes
        </span>
      </div>
    </div>
  </div>
</template>
