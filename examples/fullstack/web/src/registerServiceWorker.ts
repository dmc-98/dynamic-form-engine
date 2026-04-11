export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  const shouldRegister = import.meta.env.PROD || String(import.meta.env.VITE_ENABLE_SW) === 'true'
  if (!shouldRegister) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Failed to register service worker:', error)
    })
  })
}
