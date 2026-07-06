import { useState, useCallback } from 'react'
import type { FigureType } from '../types/figures'
import { runOcr, type OcrProvider } from '../api/ocrApi'
import { runTesseract } from '../ocr/tesseractWorker'

export type { OcrProvider }

export type OcrStatus = 'idle' | 'processing' | 'done' | 'error'

export interface OcrState {
  status: OcrStatus
  extracted: Record<string, unknown> | null
  detectedType: FigureType | null
  error: string | null
}

const PROVIDER_KEY: Record<Exclude<OcrProvider, 'tesseract'>, string> = {
  claude: 'ocr_anthropic_key',
  openai: 'ocr_openai_key',
  gemini: 'ocr_google_key',
}

export function useOcr() {
  const [state, setState] = useState<OcrState>({ status: 'idle', extracted: null, detectedType: null, error: null })

  const run = useCallback(async (imageB64: string, type: FigureType | 'auto', provider: OcrProvider) => {
    setState({ status: 'processing', extracted: null, detectedType: null, error: null })

    try {
      if (provider === 'tesseract') {
        if (type === 'auto') {
          setState({ status: 'error', extracted: null, detectedType: null, error: 'Tesseract は自動検出に対応していません。図種を手動で選択してください。' })
          return
        }
        const result = await runTesseract(imageB64, type)
        setState({ status: 'done', extracted: result, detectedType: type, error: null })
        return
      }

      const apiKey = localStorage.getItem(PROVIDER_KEY[provider]) ?? ''
      if (!apiKey) {
        setState({ status: 'error', extracted: null, detectedType: null, error: `${provider} のAPIキーが未設定です。⚙️ から設定してください。` })
        return
      }

      const result = await runOcr(imageB64, type, provider, apiKey)
      setState({ status: 'done', extracted: result.extracted, detectedType: result.type, error: null })
    } catch (e) {
      setState({
        status: 'error',
        extracted: null,
        detectedType: null,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle', extracted: null, detectedType: null, error: null }), [])

  return { ...state, run, reset }
}
