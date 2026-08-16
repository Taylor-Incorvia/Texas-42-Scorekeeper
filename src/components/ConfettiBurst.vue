<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

const props = defineProps<{
  /** Paper colours, cycled through as pieces are created. */
  colors: string[]
}>()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

/**
 * Two cannons in the bottom corners firing up and inwards. Nothing here is a
 * fixed pixel count, so the burst covers the same proportion of the screen on a
 * small phone as it does on a tablet. Note that the vertical launch scales off
 * the height and the horizontal off the *width*: the board is a tall, narrow
 * column, and a single speed shared by both axes throws every piece out of the
 * sides long before it can fall back down.
 */
const PIECES_PER_CANNON = 45
const LAUNCH_UP = [0.021, 0.035] // fraction of the height, per frame
const LAUNCH_IN = [0.004, 0.014] // fraction of the width, per frame
const GRAVITY = 0.00055
const DRAG = 0.985
/**
 * Paper stops accelerating almost immediately, so the fall is capped rather
 * than left to gravity. Without this the pieces rocket off the bottom edge
 * about a second after launch; with it they hang and flutter down instead.
 */
const TERMINAL_VELOCITY = 0.01
/** Sideways drift as a piece tumbles, which keeps the descent from looking rigid. */
const SWAY = 0.005
const FADE_AFTER = 2000 // ms of full opacity before the stragglers dissolve
const FADE_OVER = 900

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  /** Half-width and half-height of the paper rectangle, in px. */
  w: number
  h: number
  angle: number
  spin: number
  /** Phase of the edge-on tumble, which squashes the piece horizontally. */
  flutter: number
  flutterRate: number
  color: string
}

let pieces: Piece[] = []
let frame = 0
let start = 0

const rand = (min: number, max: number): number => min + Math.random() * (max - min)

function createPieces(width: number, height: number): Piece[] {
  const made: Piece[] = []
  for (const side of [0, 1]) {
    // Left cannon throws to the right, right cannon to the left.
    const inwards = side === 0 ? 1 : -1
    for (let i = 0; i < PIECES_PER_CANNON; i += 1) {
      made.push({
        x: side === 0 ? 0 : width,
        y: height,
        vx: inwards * width * rand(LAUNCH_IN[0], LAUNCH_IN[1]),
        vy: -height * rand(LAUNCH_UP[0], LAUNCH_UP[1]),
        w: rand(3, 6),
        h: rand(5, 10),
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.22, 0.22),
        flutter: rand(0, Math.PI * 2),
        flutterRate: rand(0.08, 0.18),
        color: props.colors[made.length % props.colors.length],
      })
    }
  }
  return made
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number): void {
  ctx.clearRect(0, 0, width, height)
  const alpha = elapsed < FADE_AFTER ? 1 : Math.max(0, 1 - (elapsed - FADE_AFTER) / FADE_OVER)

  for (const piece of pieces) {
    ctx.save()
    ctx.translate(piece.x, piece.y)
    ctx.rotate(piece.angle)
    // Squashing the width as the piece turns edge-on reads as a paper tumble
    // without needing an actual 3D transform.
    ctx.scale(Math.cos(piece.flutter), 1)
    ctx.globalAlpha = alpha
    ctx.fillStyle = piece.color
    ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h)
    ctx.restore()
  }
}

function advance(width: number, height: number, step: number): void {
  const terminal = TERMINAL_VELOCITY * height
  const sway = SWAY * width
  for (const piece of pieces) {
    piece.vy = Math.min(piece.vy + GRAVITY * height * step, terminal)
    piece.vx *= DRAG ** step
    piece.flutter += piece.flutterRate * step
    piece.x += (piece.vx + Math.cos(piece.flutter) * sway) * step
    piece.y += piece.vy * step
    piece.angle += piece.spin * step
  }
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  // A celebration is pure decoration, so honour a request for stillness.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const ctx = el.getContext('2d')
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = el.clientWidth
  const height = el.clientHeight
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  ctx.scale(dpr, dpr)

  pieces = createPieces(width, height)

  let previous = 0
  const tick = (now: number): void => {
    if (!start) {
      start = now
      previous = now
    }
    // Normalise to 60fps steps, and cap so a backgrounded tab doesn't teleport
    // every piece off-screen in one jump.
    const step = Math.min((now - previous) / (1000 / 60), 3)
    previous = now
    const elapsed = now - start

    advance(width, height, step)
    draw(ctx, width, height, elapsed)

    const done =
      elapsed > FADE_AFTER + FADE_OVER || pieces.every((piece) => piece.y - piece.h > height)
    if (done) {
      ctx.clearRect(0, 0, width, height)
      pieces = []
      frame = 0
      return
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
</template>
