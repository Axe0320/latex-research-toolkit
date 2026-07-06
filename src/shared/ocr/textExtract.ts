import type { VisionProvider } from './visionOcr'

export interface TextExtractResult {
  extracted: Record<string, unknown>
}

/**
 * Text-based counterpart to runVisionOcr (visionOcr.ts) — same providers and
 * SCHEMAS/domainType, but calls /api/extract (api/extract.py) with pasted or
 * file-derived text instead of an image. See docs/decisions-log.md for why
 * this is a separate endpoint rather than making image optional on /api/ocr.
 */
export async function runTextExtract(
  text: string,
  domainType: string,
  provider: VisionProvider,
  apiKey: string,
): Promise<TextExtractResult> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, domain: domainType, provider, api_key: apiKey }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
  return json as TextExtractResult
}
