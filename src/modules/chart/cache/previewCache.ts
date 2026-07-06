const cache = new Map<string, string>()

export const setPreview   = (id: string, b64: string): void => { cache.set(id, b64) }
export const getPreview   = (id: string): string | null => cache.get(id) ?? null
export const clearPreview = (id: string): void => { cache.delete(id) }
