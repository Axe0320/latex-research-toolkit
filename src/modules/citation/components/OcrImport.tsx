import { useEffect, useRef, useState } from 'react'
import { useOcr, preprocessImageB64, type OcrProvider } from '../../../shared/ocr'

const PROVIDERS: { value: OcrProvider; label: string; key?: string }[] = [
  { value: 'claude', label: 'Claude', key: 'ocr_anthropic_key' },
  { value: 'openai', label: 'GPT-4o', key: 'ocr_openai_key' },
  { value: 'gemini', label: 'Gemini', key: 'ocr_google_key' },
  { value: 'tesseract', label: 'Tesseract（ローカル）' },
]

interface Props {
  onExtracted: (text: string) => void
}

function extractedToText(extracted: Record<string, unknown>): string | null {
  if (Array.isArray(extracted.citations)) return (extracted.citations as string[]).join('\n\n')
  if (typeof extracted._raw === 'string') return extracted._raw
  return null
}

// Reference-list photo → citation text, feeding the same Text tab
// (docs/02-integrations.md §3.3) that already runs detectFormat/parseByFormat
// on batches of plain-text citations — no separate confirm UI needed.
export default function OcrImport({ onExtracted }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [provider, setProvider] = useState<OcrProvider>('claude')
  const [isDragOver, setIsDragOver] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { status, extracted, error, run, reset } = useOcr('citation_list')

  const loadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const url = e.target?.result as string
      setImageUrl(url)
      const rawB64 = url.split(',')[1] ?? ''
      try { setImageB64(await preprocessImageB64(rawB64)) } catch { setImageB64(rawB64) }
      setExtractError(null)
      reset()
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (status !== 'done' || !extracted) return
    const text = extractedToText(extracted)
    if (!text) { setExtractError('抽出結果を読み取れませんでした'); return }
    onExtracted(text)
  }, [status, extracted, onExtracted])

  const hasKey = provider !== 'tesseract' && Boolean(
    localStorage.getItem(PROVIDERS.find((p) => p.value === provider)?.key ?? '')?.trim()
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div
        className={`upload-zone${isDragOver ? ' drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
      >
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) loadFile(f) }} />
        {imageUrl ? (
          <img src={imageUrl} alt="preview" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }} />
        ) : (
          <span className="upload-hint">参考文献リストの画像をドロップ、またはクリックして選択</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            onClick={() => setProvider(p.value)}
            className={`type-btn${provider === p.value ? ' active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {provider !== 'tesseract' && !hasKey && (
        <p className="fetch-hint">このプロバイダのAPIキーが未設定です。⚙️ APIキー設定（Chartタブと共有）から設定してください。</p>
      )}

      <button
        className="convert-btn"
        disabled={!imageB64 || status === 'processing'}
        onClick={() => imageB64 && run(imageB64, provider)}
      >
        {status === 'processing' ? '解析中...' : '解析してTextタブに取り込む'}
      </button>

      {(error || extractError) && <div className="error-msg"><span>⚠</span> {error ?? extractError}</div>}
    </div>
  )
}
