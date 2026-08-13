import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'texas42:scorekeeper:v1'

export const TARGET_MARKS = 7
export const MAX_MARKS_PER_HAND = 4

/**
 * Seats are numbered 0-3 and laid out clockwise starting at the bottom of the
 * wheel. With everyone facing the middle of the table, the next seat clockwise
 * on a top-down view is the player on your left — which is exactly who shakes
 * next. Partners are therefore always two seats apart, so a seat's team is
 * simply `seat % 2`.
 */
export const TEAM_OF_SEAT = [0, 1, 0, 1]

/**
 * A hand is the only thing the app records: `{ team, marks }`, where `team` is
 * null when nobody bid. This is what makes the two awkward cases in 42 stop
 * being special — a 2-mark bid is one hand worth 2 marks, and a passed-out hand
 * is one hand worth 0. The shaker advances once per hand either way.
 */
const blankGame = () => ({
  names: ['', '', '', ''],
  firstShaker: null, // null until the players pick who shakes first
  hands: [],
})

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blankGame()
    return { ...blankGame(), ...JSON.parse(raw) }
  } catch {
    return blankGame()
  }
}

const state = ref(loadState())

watch(
  state,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Private browsing or a full quota — the game still works, it just
      // won't survive a refresh. Not worth interrupting play over.
    }
  },
  { deep: true },
)

export function useGame() {
  const names = computed(() =>
    state.value.names.map((name, seat) => name.trim() || `Player ${seat + 1}`),
  )

  const rawNames = computed(() => state.value.names)
  const hands = computed(() => state.value.hands)
  const started = computed(() => state.value.firstShaker !== null)

  /**
   * Monotonic count of shakes since seat 0, used to drive the wheel. Rotating
   * by `turns` rather than by the seat index means the hand always sweeps
   * forward one quarter-turn instead of snapping backwards three quarters when
   * it wraps past seat 3 — and it winds back correctly on undo.
   */
  const turns = computed(() =>
    started.value ? state.value.firstShaker + state.value.hands.length : 0,
  )

  const shaker = computed(() => turns.value % 4)

  const scores = computed(() => {
    const totals = [0, 0]
    for (const hand of state.value.hands) {
      if (hand.team !== null) totals[hand.team] += hand.marks
    }
    return totals
  })

  const teamNames = computed(() => [
    `${names.value[0]} & ${names.value[2]}`,
    `${names.value[1]} & ${names.value[3]}`,
  ])

  const winner = computed(() => {
    if (scores.value[0] >= TARGET_MARKS) return 0
    if (scores.value[1] >= TARGET_MARKS) return 1
    return null
  })

  const canUndo = computed(() => state.value.hands.length > 0)

  function setName(seat, value) {
    state.value.names[seat] = value
  }

  function startWith(seat) {
    state.value.firstShaker = seat
    state.value.hands = []
  }

  function startRandom() {
    startWith(Math.floor(Math.random() * 4))
  }

  function recordHand(team, marks) {
    if (!started.value || winner.value !== null) return
    state.value.hands.push({ team, marks: team === null ? 0 : marks })
  }

  function undo() {
    state.value.hands.pop()
  }

  /** Rematch: whoever was up next when the game ended shakes first. */
  function rematch() {
    state.value.firstShaker = shaker.value
    state.value.hands = []
  }

  /** Start over from the "who shakes first?" prompt, keeping the names. */
  function reset() {
    state.value = { ...blankGame(), names: [...state.value.names] }
  }

  return {
    names,
    rawNames,
    teamNames,
    hands,
    started,
    turns,
    shaker,
    scores,
    winner,
    canUndo,
    setName,
    startWith,
    startRandom,
    recordHand,
    undo,
    rematch,
    reset,
  }
}
