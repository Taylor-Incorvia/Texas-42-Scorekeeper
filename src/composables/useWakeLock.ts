import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface WakeLock {
  /** True while the screen is actually being held awake. */
  active: Ref<boolean>
  /** False when the browser has no Wake Lock API at all, so the UI can say so. */
  supported: boolean
}

/**
 * Keeps the screen awake while the app is open — the phone sits on the table
 * between rounds, and having to wake and unlock it every time defeats the point
 * of not using paper.
 *
 * Two things make this fiddlier than one `request()` call:
 *
 * 1. iOS Safari rejects the request unless it happens inside a user gesture, so
 *    asking on mount alone silently fails and the phone sleeps anyway. We try on
 *    mount for the browsers that allow it, then retry on the first tap.
 * 2. The lock is dropped every time the tab is hidden — including a glance at
 *    another app — so it has to be retaken on the way back.
 *
 * The API is also only exposed in a secure context: over plain http on a LAN
 * address `navigator.wakeLock` is undefined, which is what `supported` reports.
 */
export function useWakeLock(): WakeLock {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const active = ref(false)
  let sentinel: WakeLockSentinel | null = null

  async function acquire(): Promise<void> {
    if (!supported || sentinel || document.visibilityState !== 'visible') return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => {
        sentinel = null
        active.value = false
      })
    } catch {
      // Denied, or the gesture wasn't good enough. The retry handlers below get
      // another chance on the next tap.
      active.value = false
    }
  }

  function retry(): void {
    if (!active.value) void acquire()
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') retry()
  }

  onMounted(() => {
    void acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)
    // Every tap on the board is a fresh chance to satisfy iOS. These stay bound
    // rather than firing once, because the lock can be revoked at any time.
    document.addEventListener('pointerdown', retry)
    // Coming back through the bfcache doesn't fire visibilitychange.
    window.addEventListener('pageshow', retry)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    document.removeEventListener('pointerdown', retry)
    window.removeEventListener('pageshow', retry)
    void sentinel?.release()
    sentinel = null
    active.value = false
  })

  return { active, supported }
}
