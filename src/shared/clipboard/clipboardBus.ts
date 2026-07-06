import { getDB } from '../persistence'
import type { ClipboardItem } from './types'

const KEY = 'current'

type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((fn) => fn())
}

export function subscribeClipboard(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export async function sendToClipboard(item: ClipboardItem): Promise<void> {
  const db = await getDB()
  await db.put('clipboard', item, KEY)
  notify()
}

export async function peekClipboard(): Promise<ClipboardItem | null> {
  const db = await getDB()
  return (await db.get('clipboard', KEY)) ?? null
}

export async function consumeClipboard(): Promise<ClipboardItem | null> {
  const db = await getDB()
  const item = (await db.get('clipboard', KEY)) ?? null
  if (item) {
    await db.delete('clipboard', KEY)
    notify()
  }
  return item
}
