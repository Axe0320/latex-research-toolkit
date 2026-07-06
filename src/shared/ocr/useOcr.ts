import { useCallback, useState } from 'react'
import { runVisionOcr, type VisionProvider } from './visionOcr'
import { runTesseract } from './tesseractWorker'

export type OcrProvider = VisionProvider | 'tesseract'

export type OcrStatus = 'idle' | 'processing' | 'done' | 'error'

export interface OcrState {
  status: OcrStatus
  extracted: Record<string, unknown> | null
  error: string | null
}

const PROVIDER_KEY: Record<VisionProvider, string> = {
  claude: 'ocr_anthropic_key',
  openai: 'ocr_openai_key',
  gemini: 'ocr_google_key',
}

/** Generic OCR hook. `domainType` picks the backend schema (see visionOcr.ts). */
export function useOcr(domainType: string) {
  const [state, setState] = useState<OcrState>({ status: 'idle', extracted: null, error: null })

  const run = useCallback(async (imageB64: string, provider: OcrProvider) => {
    setState({ status: 'processing', extracted: null, error: null })
    try {
      if (provider === 'tesseract') {
        const text = await runTesseract(imageB64)
        setState({ status: 'done', extracted: { _raw: text }, error: null })
        return
      }

      const apiKey = localStorage.getItem(PROVIDER_KEY[provider]) ?? ''
      if (!apiKey) {
        setState({ status: 'error', extracted: null, error: `${provider} のAPIキーが未設定です。⚙️ から設定してください。` })
        return
      }

      const result = await runVisionOcr(imageB64, domainType, provider, apiKey)
      setState({ status: 'done', extracted: result.extracted, error: null })
    } catch (e) {
      setState({ status: 'error', extracted: null, error: e instanceof Error ? e.message : String(e) })
    }
  }, [domainType])

  const reset = useCallback(() => setState({ status: 'idle', extracted: null, error: null }), [])

  return { ...state, run, reset }
}
