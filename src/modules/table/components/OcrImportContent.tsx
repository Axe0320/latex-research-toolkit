import { useEffect, useRef, useState } from 'react'
import { useOcr, preprocessImageB64, type OcrProvider } from '../../../shared/ocr'
import type { TableModel } from '../lib/table/types'
import { parseInput } from '../lib/table/parser'

const PROVIDERS: { value: OcrProvider; label: string; key?: string }[] = [
  { value: 'claude', label: 'Claude', key: 'ocr_anthropic_key' },
  { value: 'openai', label: 'GPT-4o', key: 'ocr_openai_key' },
  { value: 'gemini', label: 'Gemini', key: 'ocr_google_key' },
  { value: 'tesseract', label: 'Tesseract（ローカル）' },
]

interface Props {
  onParse: (model: TableModel) => void
}

// Structured extraction from Vision AI ({columns, rows}) or raw OCR text
// (Tesseract fallback) is converted to TSV, then run through the exact same
// parseInput() the Paste tab uses — reusing Table's existing robust parser
// instead of building a separate confirm/edit UI for this import path.
function extractedToTsv(extracted: Record<string, unknown>): string | null {
  const columns = extracted.columns
  const rows = extracted.rows
  if (Array.isArray(columns) && Array.isArray(rows)) {
    const lines = [columns as string[], ...(rows as string[][])]
    return lines.map((r) => r.join('\t')).join('\n')
  }
  if (typeof extracted._raw === 'string') return extracted._raw
  return null
}

export function OcrImportContent({ onParse }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [provider, setProvider] = useState<OcrProvider>('claude')
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { status, extracted, error, run, reset } = useOcr('table_data')

  const loadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const url = e.target?.result as string
      setImageUrl(url)
      const rawB64 = url.split(',')[1] ?? ''
      try { setImageB64(await preprocessImageB64(rawB64)) } catch { setImageB64(rawB64) }
      setParseError(null)
      reset()
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (status !== 'done' || !extracted) return
    const tsv = extractedToTsv(extracted)
    if (!tsv) { setParseError('抽出結果を読み取れませんでした'); return }
    const model = parseInput(tsv)
    if (!model) { setParseError('抽出結果を表として解析できませんでした。手動で貼り付けて修正してください。'); return }
    onParse(model)
  }, [status, extracted, onParse])

  const hasKey = provider !== 'tesseract' && Boolean(
    localStorage.getItem(PROVIDERS.find((p) => p.value === provider)?.key ?? '')?.trim()
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
        onClick={() => fileRef.current?.click()}
        style={{
          minHeight: imageUrl ? '100px' : '120px', cursor: 'pointer', padding: '1rem',
          border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--rs)',
          background: isDragging ? 'var(--accent-light)' : 'var(--bg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '0.5rem', transition: 'all .15s',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="preview" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }} />
        ) : (
          <>
            <span style={{ fontSize: '1.5rem' }}>🖼️</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-sub)', margin: 0 }}>表の画像をドロップ、またはクリックして選択</p>
          </>
        )}
        <input ref={fileRef} type="file" hidden accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) loadFile(f) }} />
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            onClick={() => setProvider(p.value)}
            className="text-xs font-semibold"
            style={{
              padding: '0.35rem 0.75rem', borderRadius: 'var(--rx)',
              border: `1.5px solid ${provider === p.value ? 'var(--accent)' : 'var(--border)'}`,
              background: provider === p.value ? 'var(--accent-light)' : 'var(--card)',
              color: provider === p.value ? 'var(--accent)' : 'var(--text-sub)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {provider !== 'tesseract' && !hasKey && (
        <p className="text-xs" style={{ color: '#D97706' }}>このプロバイダのAPIキーが未設定です。Citationタブと共有のlocalStorageに保存されます。</p>
      )}

      <button
        className="btn-primary w-full"
        disabled={!imageB64 || status === 'processing'}
        onClick={() => imageB64 && run(imageB64, provider)}
      >
        {status === 'processing' ? '解析中...' : '解析して表として取り込む'}
      </button>

      {(error || parseError) && <p className="text-xs" style={{ color: '#EF4444' }}>{error ?? parseError}</p>}
    </div>
  )
}
