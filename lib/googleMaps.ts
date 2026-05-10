let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  // Already fully available in global scope (covers HMR re-eval)
  if ((window as any).google?.maps) return Promise.resolve()

  // Deduplicate concurrent calls — return the in-flight promise
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    // Script tag already in DOM (injected before HMR reset loadPromise)
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    )
    if (existing) {
      // If google.maps appears while we wait, polling catches it
      const interval = setInterval(() => {
        if ((window as any).google?.maps) { clearInterval(interval); resolve() }
      }, 50)
      existing.addEventListener('error', () => {
        clearInterval(interval)
        loadPromise = null
        reject(new Error('Google Maps load error'))
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`
    script.async = true
    script.onload = () => resolve()
    script.onerror = (err) => { loadPromise = null; reject(err) }
    document.head.appendChild(script)
  })

  return loadPromise
}
