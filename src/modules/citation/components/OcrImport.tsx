import { useEffect, useRef, useState } from 'react'
import { useTextExtract, PROVIDER_COLORS, type VisionProvider } from '../../../shared/ocr'

const PROVIDERS: { value: VisionProvider; label: string; key: string }[] = [
  { value: 'claude', label: 'Claude', key: 'ocr_anthropic_key' },
  { value: 'openai', label: 'GPT-4o', key: 'ocr_openai_key' },
  { value: 'gemini', label: 'Gemini', key: 'ocr_google_key' },
]

interface Props {
  onExtracted: (text: string) => void
}

function extractedToText(extracted: Record<string, unknown>): string | null {
  if (Array.isArray(extracted.citations)) return (extracted.citations as string[]).join('\n\n')
  if (typeof extracted._raw === 'string') return extracted._raw
  return null
}

// Free-form pasted text (or a text/CSV file) → citation text, feeding the
// same Text tab (docs/02-integrations.md §3.3) that already runs
// detectFormat/parseByFormat on batches of plain-text citations — no
// separate confirm UI needed. Replaces image-based OCR here: in practice
// nobody screenshots a reference list they already have as text/a file (see
// docs/decisions-log.md) — image OCR remains only in Chart, where the chart
// image genuinely is the data.
export default function OcrImport({ onExtracted }: Props) {
  const [rawText, setRawText] = useState('')
  const [provider, setProvider] = useState<VisionProvider>('claude')
  const [extractError, setExtractError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { status, extracted, error, run, reset } = useTextExtract('citation_list')

  const loadFile = async (file: File) => {
    setExtractError(null)
    reset()
    try {
      setRawText(await file.text())
    } catch {
      setExtractError('ファイルを読み込めませんでした')
    }
  }

  useEffect(() => {
    if (status !== 'done' || !extracted) return
    const text = extractedToText(extracted)
    if (!text) { setExtractError('抽出結果を読み取れませんでした'); return }
    onExtracted(text)
  }, [status, extracted, onExtracted])

  const hasKey = Boolean(localStorage.getItem(PROVIDERS.find((p) => p.value === provider)?.key ?? '')?.trim())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <textarea
        value={rawText}
        onChange={(e) => { setRawText(e.target.value); setExtractError(null); reset() }}
        placeholder={'参考文献リストをそのまま貼り付けてください（雑多な改行・書式で構いません）\n\n例：\nJ. Smith and A. Doe, "A great paper," in Proc. of ..., 2023, pp. 1-10.\n田中太郎「なんとかの研究」情報処理学会論文誌, 2022...'}
        rows={6}
      />
      <div className="fetch-hint">
        またはファイルを読み込む：
        <button
          type="button"
          className="type-btn"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => fileRef.current?.click()}
        >
          📄 ファイルを選択
        </button>
        <input ref={fileRef} type="file" accept=".txt,.csv,.tsv,text/plain,text/csv" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) loadFile(f) }} />
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {PROVIDERS.map((p) => {
          const color = PROVIDER_COLORS[p.value]
          return (
            <button
              key={p.value}
              onClick={() => setProvider(p.value)}
              className="text-xs font-semibold"
              style={{
                padding: '0.35rem 0.75rem', borderRadius: 'var(--rx)',
                border: `1.5px solid ${color}`,
                background: provider === p.value ? color : `${color}18`,
                color: provider === p.value ? 'white' : color,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      {!hasKey && (
        <p className="fetch-hint">このプロバイダのAPIキーが未設定です。画面上部の「⚙️ APIキー」から設定してください。</p>
      )}

      <button
        className="convert-btn"
        disabled={!rawText.trim() || status === 'processing'}
        onClick={() => run(rawText, provider)}
      >
        {status === 'processing' ? '解析中...' : 'AIで解析してTextタブに取り込む'}
      </button>

      {(error || extractError) && <div className="error-msg"><span>⚠</span> {error ?? extractError}</div>}
    </div>
  )
}
