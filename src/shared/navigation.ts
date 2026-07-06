// Lets a module request a tab switch (e.g. Chart's "Send to Figure Converter")
// without needing a prop-drilled reference to App.tsx's own tab state.
type Listener = (tab: string) => void
const listeners = new Set<Listener>()

export function requestTab(tab: string): void {
  listeners.forEach((fn) => fn(tab))
}

export function onTabRequest(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
