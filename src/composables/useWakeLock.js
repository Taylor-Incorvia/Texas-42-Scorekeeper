import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Keeps the screen awake while the app is open — the phone sits on the table
 * between hands, and having to wake and unlock it every round defeats the
 * point of not using paper. Unsupported browsers just no-op.
 */
export function useWakeLock() {
  let sentinel = null

  async function acquire() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener('release', () => {
        sentinel = null
      })
    } catch {
      // Denied or interrupted (low battery, backgrounded). Harmless.
    }
  }

  // The lock is dropped whenever the tab is hidden, so it has to be retaken
  // every time the player comes back to the app.
  function onVisibilityChange() {
    if (document.visibilityState === 'visible' && !sentinel) acquire()
  }

  onMounted(() => {
    acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    sentinel?.release?.()
    sentinel = null
  })
}
