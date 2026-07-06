export type VisionProvider = 'claude' | 'openai' | 'gemini'

export interface VisionOcrResult {
  extracted: Record<string, unknown>
}

/**
 * Generic Vision AI OCR client (docs/02-integrations.md §3.3). `domainType`
 * selects which JSON schema `/api/ocr` (api/_lib/vision.py `SCHEMAS`) asks
 * the model to fill in — e.g. 'table_data' or 'citation_list' — rather than
 * one of Chart's FigureType values.
 */
export async function runVisionOcr(
  imageB64: string,
  domainType: string,
  provider: VisionProvider,
  apiKey: string,
): Promise<VisionOcrResult> {
  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageB64, type: domainType, provider, api_key: apiKey }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
  return json as VisionOcrResult
}
