import { useCallback, useEffect, useState } from 'react'
import { consumeClipboard, peekClipboard, sendToClipboard, subscribeClipboard } from './clipboardBus'
import type { ClipboardItem } from './types'

export function useClipboard() {
  const [item, setItem] = useState<ClipboardItem | null>(null)

  useEffect(() => {
    let cancelled = false
    const refresh = () => { peekClipboard().then((i) => { if (!cancelled) setItem(i) }) }
    refresh()
    const unsubscribe = subscribeClipboard(refresh)
    return () => { cancelled = true; unsubscribe() }
  }, [])

  const send = useCallback((next: ClipboardItem) => sendToClipboard(next), [])
  const consume = useCallback(() => consumeClipboard(), [])

  return { item, send, consume }
}
