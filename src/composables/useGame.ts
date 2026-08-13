import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

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
export type Seat = 0 | 1 | 2 | 3
export type Team = 0 | 1

export const TEAM_OF_SEAT: Readonly<Record<Seat, Team>> = [0, 1, 0, 1]

/** A per-team pair, always indexed by `Team`. */
export type ByTeam<T> = [T, T]
export type BySeat<T> = [T, T, T, T]

/**
 * The result of one round — the only thing the app records. `team` is null when
 * nobody bid. This is what makes the two awkward cases in 42 stop being
 * special: a 2-mark bid is one round worth 2 marks, and a passed-out round is
 * one round worth 0. The shaker advances once per round either way.
 */
export interface Round {
  team: Team | null
  marks: number
}

export interface GameState {
  names: BySeat<string>
  /** null until the players pick who shakes first. */
  firstShaker: Seat | null
  hands: Round[]
}

const blankGame = (): GameState => ({
  names: ['', '', '', ''],
  firstShaker: null,
  hands: [],
})

/** Anything at all could be in storage, so treat it as unknown and rebuild. */
function reviveState(raw: unknown): GameState {
  const base = blankGame()
  if (typeof raw !== 'object' || raw === null) return base
  const saved = raw as Partial<GameState>

  if (Array.isArray(saved.names)) {
    base.names = base.names.map((fallback, seat) =>
      typeof saved.names?.[seat] === 'string' ? saved.names[seat] : fallback,
    ) as BySeat<string>
  }
  if (typeof saved.firstShaker === 'number' && saved.firstShaker >= 0 && saved.firstShaker <= 3) {
    base.firstShaker = saved.firstShaker
  }
  if (Array.isArray(saved.hands)) {
    base.hands = saved.hands.filter(
      (hand): hand is Round =>
        typeof hand === 'object' &&
        hand !== null &&
        typeof hand.marks === 'number' &&
        (hand.team === null || hand.team === 0 || hand.team === 1),
    )
  }
  return base
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? reviveState(JSON.parse(raw)) : blankGame()
  } catch {
    return blankGame()
  }
}

const state: Ref<GameState> = ref(loadState())

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

/** Normalise any integer onto the wheel. Modulo of a seat count is always a Seat. */
const toSeat = (value: number): Seat => (((value % 4) + 4) % 4) as Seat

export interface Game {
  names: ComputedRef<BySeat<string>>
  rawNames: ComputedRef<BySeat<string>>
  teamNames: ComputedRef<ByTeam<string>>
  hands: ComputedRef<readonly Round[]>
  started: ComputedRef<boolean>
  turns: ComputedRef<number>
  shaker: ComputedRef<Seat>
  scores: ComputedRef<ByTeam<number>>
  winner: ComputedRef<Team | null>
  canUndo: ComputedRef<boolean>
  setName: (seat: Seat, value: string) => void
  startWith: (seat: number) => void
  startRandom: () => void
  recordHand: (team: Team | null, marks: number) => void
  undo: () => void
  rematch: () => void
  reset: () => void
}

export function useGame(): Game {
  const names = computed(
    () =>
      state.value.names.map((name, seat) => name.trim() || `Player ${seat + 1}`) as BySeat<string>,
  )

  const rawNames = computed(() => state.value.names)
  const hands = computed<readonly Round[]>(() => state.value.hands)
  const started = computed(() => state.value.firstShaker !== null)

  /**
   * Monotonic count of shakes since seat 0, used to drive the wheel. Rotating
   * by `turns` rather than by the seat index means the hand always sweeps
   * forward one quarter-turn instead of snapping backwards three quarters when
   * it wraps past seat 3 — and it winds back correctly on undo.
   */
  const turns = computed(() =>
    state.value.firstShaker === null ? 0 : state.value.firstShaker + state.value.hands.length,
  )

  const shaker = computed(() => toSeat(turns.value))

  const scores = computed<ByTeam<number>>(() => {
    const totals: ByTeam<number> = [0, 0]
    for (const hand of state.value.hands) {
      if (hand.team !== null) totals[hand.team] += hand.marks
    }
    return totals
  })

  const teamNames = computed<ByTeam<string>>(() => [
    `${names.value[0]} & ${names.value[2]}`,
    `${names.value[1]} & ${names.value[3]}`,
  ])

  const winner = computed<Team | null>(() => {
    if (scores.value[0] >= TARGET_MARKS) return 0
    if (scores.value[1] >= TARGET_MARKS) return 1
    return null
  })

  const canUndo = computed(() => state.value.hands.length > 0)

  function setName(seat: Seat, value: string): void {
    state.value.names[seat] = value
  }

  function startWith(seat: number): void {
    state.value.firstShaker = toSeat(seat)
    state.value.hands = []
  }

  function startRandom(): void {
    startWith(Math.floor(Math.random() * 4))
  }

  function recordHand(team: Team | null, marks: number): void {
    if (state.value.firstShaker === null || winner.value !== null) return
    state.value.hands.push({ team, marks: team === null ? 0 : marks })
  }

  function undo(): void {
    state.value.hands.pop()
  }

  /** Rematch: whoever was up next when the game ended shakes first. */
  function rematch(): void {
    state.value.firstShaker = shaker.value
    state.value.hands = []
  }

  /** Start over from the "who shakes first?" prompt, keeping the names. */
  function reset(): void {
    state.value = { ...blankGame(), names: [...state.value.names] as BySeat<string> }
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
