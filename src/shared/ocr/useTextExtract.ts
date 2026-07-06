import { useCallback, useState } from 'react'
import { runTextExtract } from './textExtract'
import type { VisionProvider } from './visionOcr'

export type TextExtractStatus = 'idle' | 'processing' | 'done' | 'error'

export interface TextExtractState {
  status: TextExtractStatus
  extracted: Record<string, unknown> | null
  error: string | null
}

const PROVIDER_KEY: Record<VisionProvider, string> = {
  claude: 'ocr_anthropic_key',
  openai: 'ocr_openai_key',
  gemini: 'ocr_google_key',
}

/** Text-based counterpart to useOcr — no Tesseract option (nothing to OCR). */
export function useTextExtract(domainType: string) {
  const [state, setState] = useState<TextExtractState>({ status: 'idle', extracted: null, error: null })

  const run = useCallback(async (text: string, provider: VisionProvider) => {
    setState({ status: 'processing', extracted: null, error: null })
    try {
      const apiKey = localStorage.getItem(PROVIDER_KEY[provider]) ?? ''
      if (!apiKey) {
        setState({ status: 'error', extracted: null, error: `${provider} のAPIキーが未設定です。画面上部の「⚙️ APIキー」から設定してください。` })
        return
      }
      const result = await runTextExtract(text, domainType, provider, apiKey)
      setState({ status: 'done', extracted: result.extracted, error: null })
    } catch (e) {
      setState({ status: 'error', extracted: null, error: e instanceof Error ? e.message : String(e) })
    }
  }, [domainType])

  const reset = useCallback(() => setState({ status: 'idle', extracted: null, error: null }), [])

  return { ...state, run, reset }
}
