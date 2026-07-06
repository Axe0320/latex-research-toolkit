import { useEffect, useRef, useState } from 'react'
import { useTextExtract, PROVIDER_COLORS, type VisionProvider } from '../../../shared/ocr'
import type { TableModel } from '../lib/table/types'
import { parseInput } from '../lib/table/parser'

const PROVIDERS: { value: VisionProvider; label: string; key: string }[] = [
  { value: 'claude', label: 'Claude', key: 'ocr_anthropic_key' },
  { value: 'openai', label: 'GPT-4o', key: 'ocr_openai_key' },
  { value: 'gemini', label: 'Gemini', key: 'ocr_google_key' },
]

interface Props {
  onParse: (model: TableModel) => void
}

// Structured extraction ({columns, rows}) is converted to TSV, then run
// through the exact same parseInput() the Paste tab uses — reusing Table's
// existing robust parser instead of building a separate confirm/edit UI.
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

// Free-form pasted text or an uploaded text/CSV file → table, via an LLM.
// Replaces image-based OCR here: in practice nobody photographs a table they
// already have as text/a file (see docs/decisions-log.md) — this covers the
// case the Paste tab's format-detecting parser can't handle on its own
// (e.g. a stats tool's printed summary, or an inconsistently-delimited CSV).
// Image OCR remains only in Chart, where the chart image genuinely is the data.
export function OcrImportContent({ onParse }: Props) {
  const [rawText, setRawText] = useState('')
  const [provider, setProvider] = useState<VisionProvider>('claude')
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { status, extracted, error, run, reset } = useTextExtract('table_data')

  const loadFile = async (file: File) => {
    setParseError(null)
    reset()
    try {
      setRawText(await file.text())
    } catch {
      setParseError('ファイルを読み込めませんでした')
    }
  }

  useEffect(() => {
    if (status !== 'done' || !extracted) return
    const tsv = extractedToTsv(extracted)
    if (!tsv) { setParseError('抽出結果を読み取れませんでした'); return }
    const model = parseInput(tsv)
    if (!model) { setParseError('抽出結果を表として解析できませんでした。手動で貼り付けて修正してください。'); return }
    onParse(model)
  }, [status, extracted, onParse])

  const hasKey = Boolean(localStorage.getItem(PROVIDERS.find((p) => p.value === provider)?.key ?? '')?.trim())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <textarea
        value={rawText}
        onChange={(e) => { setRawText(e.target.value); setParseError(null); reset() }}
        placeholder={'表として整形したいテキストを貼り付けてください（区切りが不揃いでも構いません）\n\n例：\n手法A 精度0.92 再現率0.88\n手法B 精度0.87 再現率0.91'}
        rows={6}
        style={{
          width: '100%', fontFamily: 'inherit', fontSize: '0.85rem',
          padding: '0.6rem 0.8rem', borderRadius: 'var(--rs)',
          border: '1.5px solid var(--border)', resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
        またはファイルを読み込む：
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs font-semibold"
          style={{ padding: '0.3rem 0.6rem', borderRadius: 'var(--rx)', border: '1.5px solid var(--border)', background: 'var(--card)', cursor: 'pointer' }}
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
        <p className="text-xs" style={{ color: '#D97706' }}>このプロバイダのAPIキーが未設定です。画面上部の「⚙️ APIキー」から設定してください。</p>
      )}

      <button
        className="btn-primary w-full"
        disabled={!rawText.trim() || status === 'processing'}
        onClick={() => run(rawText, provider)}
      >
        {status === 'processing' ? '解析中...' : 'AIで解析して表として取り込む'}
      </button>

      {(error || parseError) && <p className="text-xs" style={{ color: '#EF4444' }}>{error ?? parseError}</p>}
    </div>
  )
}
