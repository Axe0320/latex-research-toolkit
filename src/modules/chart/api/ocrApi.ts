import type { FigureType } from '../types/figures'

export type OcrProvider = 'claude' | 'openai' | 'gemini' | 'tesseract'

export interface OcrResult {
  extracted: Record<string, unknown>
  type: FigureType
}

export async function runOcr(
  imageB64: string,
  type: FigureType | 'auto',
  provider: OcrProvider,
  apiKey: string,
): Promise<OcrResult> {
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageB64, type, provider, api_key: apiKey }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
  return json as OcrResult
}
