import { useState, useRef } from 'react'
import type { TableModel } from '../lib/table/types'
import type { TableSource } from '../lib/table/merge/sourceStack'
import { parseInput } from '../lib/table/parser'
import { parseHTMLTable } from '../lib/table/clipboard/parseHTMLTable'
import { parseClipboardMarkdown } from '../lib/table/clipboard/parseClipboardMarkdown'
import { MergePanel } from './MergePanel'

export type InputMode = 'paste' | 'upload' | 'create' | 'merge'

const QUICK_PRESETS = [
  { label: '2×2', rows: 2, cols: 2 },
  { label: '3×3', rows: 3, cols: 3 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '5×3', rows: 5, cols: 3 },
]

export type InputPanelProps = {
  mode: InputMode
  onCollapse?: () => void  // shown in Edit mode only (Paste+Edit layout)
  onParse: (model: TableModel) => void
  onMainFileUpload: (file: File) => Promise<void>
  onCreateTable: (rows: number, cols: number) => void
  sources: TableSource[]
  onAddSourceFiles: (files: File[]) => Promise<void>
  onApplyMerge: () => void
  onReplaceWith: (source: TableSource) => void
  onRemoveSource: (id: string) => void
  onReorderSources: (newOrder: TableSource[]) => void
  onSetSourceDirection: (id: string, direction: 'rows' | 'columns') => void
  onResetTable: () => void
}

export function InputPanel(props: InputPanelProps) {
  return (
    <div className="card" style={{ position: 'relative' }}>
      {props.onCollapse && (
        <button
          onClick={props.onCollapse}
          title="Input を折りたたむ"
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            width: '1.5rem', height: '1.5rem', border: '1px solid var(--border)',
            borderRadius: '4px', background: 'transparent', color: 'var(--text-sub)',
            cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)' }}
        >«</button>
      )}
      {props.mode === 'paste' && <PasteContent onParse={props.onParse} />}
      {props.mode === 'upload' && <UploadContent onUpload={props.onMainFileUpload} />}
      {props.mode === 'create' && <CreateContent onCreateTable={props.onCreateTable} />}
      {props.mode === 'merge' && (
        <MergePanel
          variant="inline"
          sources={props.sources}
          onAddSourceFiles={props.onAddSourceFiles}
          onApplyMerge={props.onApplyMerge}
          onReplaceWith={props.onReplaceWith}
          onRemoveSource={props.onRemoveSource}
          onReorderSources={props.onReorderSources}
          onSetSourceDirection={props.onSetSourceDirection}
        />
      )}

      {/* Common footer: clear table — visible in all modes */}
      <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button
          className="w-full"
          style={{
            fontSize: '0.875rem', padding: '0.5rem 1rem', fontWeight: 600,
            border: '1.5px solid #FDE68A', borderRadius: 'var(--rs)',
            background: '#FFFBEB', color: '#D97706',
            cursor: 'pointer', transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D97706'; e.currentTarget.style.background = '#FEF3C7' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#FDE68A'; e.currentTarget.style.background = '#FFFBEB' }}
          onClick={props.onResetTable}
        >
          テーブルをクリア
        </button>
      </div>
    </div>
  )
}

/* ── Paste ─────────────────────────────────────────────── */

function PasteContent({ onParse }: { onParse: (model: TableModel) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleParse() {
    const result = parseInput(text)
    if (result === null) {
      setError('フォーマットを検出できませんでした。TSV / CSV 形式で入力してください。')
      return
    }
    setError(null)
    onParse(result)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <textarea
        className="w-full font-mono text-sm resize-none"
        wrap="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"TSV / CSV / Excel コピー / Markdown テーブルを貼り付け...\n\nExample:\nMethod\tAcc\tF1\nOurs\t0.92\t0.91\nBaseline\t0.88\t0.87"}
        style={{
          height: '280px', overflowX: 'auto', overflowY: 'auto',
          background: '#FAFAFA',
          border: `1.5px solid ${error ? '#EF4444' : 'var(--border)'}`,
          borderRadius: 'var(--rs)', padding: '.75rem 1rem', outline: 'none',
          lineHeight: 1.75, color: 'var(--text)',
          transition: 'border-color .18s, box-shadow .18s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,.1)' }}
        onBlur={(e) => { e.target.style.borderColor = error ? '#EF4444' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
        onPaste={(e) => {
          const html = e.clipboardData?.getData('text/html') ?? ''
          if (html) {
            const rows = parseHTMLTable(html)
            if (rows && rows.length > 0) {
              e.preventDefault(); setText(rows.map(r => r.join('\t')).join('\n')); return
            }
          }
          const plain = e.clipboardData?.getData('text/plain') ?? ''
          const mdRows = parseClipboardMarkdown(plain)
          if (mdRows && mdRows.length > 0) {
            e.preventDefault(); setText(mdRows.map(r => r.join('\t')).join('\n')); return
          }
        }}
      />
      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
      <button className="btn-primary w-full" onClick={handleParse}>
        Parse Table
      </button>
    </div>
  )
}

/* ── Upload ────────────────────────────────────────────── */

function UploadContent({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handle(file: File) {
    setIsLoading(true); await onUpload(file); setIsLoading(false)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await handle(f) }}
      onClick={() => fileRef.current?.click()}
      style={{
        minHeight: '120px', cursor: 'pointer', padding: '1.25rem 1.5rem',
        border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--rs)',
        background: isDragging ? 'var(--accent-light)' : 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.875rem', transition: 'all .15s',
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>📂</span>
      <p className="text-sm font-semibold" style={{ color: isDragging ? 'var(--accent)' : 'var(--text-sub)', margin: 0 }}>
        {isLoading ? '読み込み中...' : isDragging ? 'ここにドロップ' : 'ファイルをドロップ、または'}
      </p>
      {!isLoading && !isDragging && (
        <button className="btn-secondary text-sm"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>
          ファイルを選択
        </button>
      )}
      <p className="text-xs" style={{ color: 'var(--text-light)', margin: 0 }}>
        CSV / TSV / XLSX / XLS / TXT
      </p>
      <input ref={fileRef} type="file" hidden accept=".csv,.tsv,.txt,.xlsx,.xls"
        onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await handle(f) }} />
    </div>
  )
}

/* ── Create ────────────────────────────────────────────── */

function CreateContent({ onCreateTable }: { onCreateTable: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-light)', letterSpacing: '0.08em' }}>
          Quick Create
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {QUICK_PRESETS.map((p) => (
            <button key={p.label} className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem', fontWeight: 700 }}
              onClick={() => onCreateTable(p.rows, p.cols)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border)' }} />

      <div>
        <p className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-light)', letterSpacing: '0.08em' }}>
          Custom Size
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem' }}>
          <NumField label="行数" value={rows} onChange={setRows} min={1} max={50} />
          <NumField label="列数" value={cols} onChange={setCols} min={1} max={20} />
        </div>
        <button className="btn-primary w-full" onClick={() => onCreateTable(rows, cols)}>
          Create Table
        </button>
      </div>
    </div>
  )
}

function NumField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="text-sm" style={{ color: 'var(--text-sub)' }}>{label}</span>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '72px', padding: '0.35rem 0.5rem', fontSize: '0.875rem',
          border: '1.5px solid var(--border)', borderRadius: 'var(--rx)',
          background: '#FAFAFA', color: 'var(--text)', outline: 'none', textAlign: 'center',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,.1)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}
