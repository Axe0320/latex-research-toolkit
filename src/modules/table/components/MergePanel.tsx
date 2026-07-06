import { useState, useRef } from 'react'
import type { TableSource } from '../lib/table/merge/sourceStack'

const ACCEPTED = '.csv,.tsv,.txt,.xlsx,.xls'

function isAcceptedFile(file: File): boolean {
  return /\.(csv|tsv|txt|xlsx|xls)$/i.test(file.name)
}

type Props = {
  variant?: 'default' | 'inline'
  sources: TableSource[]
  onAddSourceFiles: (files: File[]) => Promise<void>
  onApplyMerge: () => void
  onReplaceWith: (source: TableSource) => void
  onRemoveSource: (id: string) => void
  onReorderSources: (newOrder: TableSource[]) => void
  onSetSourceDirection: (id: string, direction: 'rows' | 'columns') => void
}

export function MergePanel({
  variant = 'default',
  sources,
  onAddSourceFiles,
  onApplyMerge,
  onReplaceWith,
  onRemoveSource,
  onReorderSources,
  onSetSourceDirection,
}: Props) {
  const isInline = variant === 'inline'
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: File[]) {
    const valid = files.filter(isAcceptedFile)
    if (valid.length === 0) return
    setIsLoading(true)
    await onAddSourceFiles(valid)
    setIsLoading(false)
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true) }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDragging(false) }
  async function onDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    await handleFiles(Array.from(e.dataTransfer.files))
  }
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    await handleFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function moveSource(index: number, delta: -1 | 1) {
    const next = [...sources]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    onReorderSources(next)
  }

  const content = (
    <>
      {/* Source list */}
      {sources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {sources.map((source, idx) => {
            const colCount = source.model.rows[0]?.cells.length ?? 0
            const rowCount = source.model.rows.filter(r => r.rowType !== 'header').length
            return (
              <div key={source.id} style={{
                border: '1px solid var(--border)', borderRadius: 'var(--rs)',
                padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center',
                gap: '0.5rem', background: 'var(--bg)',
              }}>
                {/* Reorder buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                  <OrderBtn onClick={() => moveSource(idx, -1)} disabled={idx === 0} title="上へ">▲</OrderBtn>
                  <OrderBtn onClick={() => moveSource(idx, 1)} disabled={idx === sources.length - 1} title="下へ">▼</OrderBtn>
                </div>

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-semibold" style={{
                    color: 'var(--text)', margin: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    📄 {source.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-light)', margin: 0 }}>
                    {colCount} 列 × {rowCount} 行 · {source.sourceType}
                  </p>
                </div>

                {/* Per-source direction toggle */}
                <div style={{
                  display: 'flex', gap: '2px', padding: '2px',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--rs)', flexShrink: 0,
                }}>
                  {(['rows', 'columns'] as const).map(d => (
                    <button
                      key={d}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => onSetSourceDirection(source.id, d)}
                      title={d === 'rows' ? '行として追加' : '列として追加'}
                      style={{
                        padding: '2px 7px', fontSize: '0.7rem', fontWeight: 600,
                        border: 'none', borderRadius: 'calc(var(--rs) - 2px)',
                        cursor: 'pointer', transition: 'all .12s', whiteSpace: 'nowrap',
                        background: source.direction === d ? 'var(--accent-light)' : 'transparent',
                        color: source.direction === d ? 'var(--accent)' : 'var(--text-sub)',
                      }}
                    >
                      {d === 'rows' ? '↓行' : '→列'}
                    </button>
                  ))}
                </div>

                {/* Replace (per-source) + Remove */}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <ABtn title="このソースで主テーブルを置き換え" warn onClick={() => onReplaceWith(source)}>
                    Replace
                  </ABtn>
                  <ABtn title="リストから削除" danger onClick={() => onRemoveSource(source.id)}>
                    ✕
                  </ABtn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Drop zone / Add button */}
      <div
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--rs)',
          background: isDragging ? 'var(--accent-light)' : 'var(--bg)',
          padding: '0.875rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <p className="text-sm font-semibold"
          style={{ color: isDragging ? 'var(--accent)' : 'var(--text-sub)', margin: '0 0 0.375rem' }}>
          {isLoading ? '読み込み中...' : isDragging ? 'ここにドロップ' : 'ここにドロップ、または'}
        </p>
        {!isLoading && !isDragging && (
          <button
            className="btn-secondary text-sm"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
          >
            📂 ソースファイルを追加
          </button>
        )}
        <p className="text-xs" style={{ color: 'var(--text-light)', margin: '0.375rem 0 0' }}>
          CSV / TSV / XLSX / TXT（複数対応）
        </p>
        <input ref={fileInputRef} type="file" hidden multiple accept={ACCEPTED} onChange={onFileChange} />
      </div>

      {/* Bottom actions */}
      <div style={{ marginTop: '0.75rem' }}>
        <button
          className="btn-primary text-sm w-full"
          disabled={sources.length === 0}
          onMouseDown={e => e.preventDefault()}
          onClick={onApplyMerge}
        >
          Apply →
        </button>
      </div>
    </>
  )

  if (isInline) return <div>{content}</div>

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', boxShadow: 'var(--shadow-md)',
      padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
    }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center text-xs font-extrabold"
          style={{ width: '1.375rem', height: '1.375rem', borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)' }}>
          M
        </span>
        <span className="text-xs font-bold uppercase"
          style={{ color: 'var(--text-light)', letterSpacing: '0.1em' }}>
          Merge Sources
        </span>
      </div>
      {content}
    </div>
  )
}

function OrderBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: '20px', height: '16px', padding: 0, fontSize: '0.55rem', lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border)', borderRadius: '3px',
        background: 'var(--card)', color: disabled ? 'var(--text-light)' : 'var(--text-sub)',
        cursor: disabled ? 'default' : 'pointer', transition: 'all .1s',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)' } }}
    >
      {children}
    </button>
  )
}

function ABtn({ title, warn = false, danger = false, disabled = false, children, onClick }: {
  title?: string; warn?: boolean; danger?: boolean; disabled?: boolean
  children: React.ReactNode; onClick: () => void
}) {
  const border = disabled ? 'var(--border)' : danger ? '#FECACA' : warn ? '#FDE68A' : 'var(--border)'
  const bg = disabled ? 'var(--bg)' : danger ? '#FEF2F2' : warn ? '#FFFBEB' : 'var(--card)'
  const text = disabled ? 'var(--text-light)' : danger ? '#EF4444' : warn ? '#D97706' : 'var(--text-sub)'
  const hBorder = danger ? '#EF4444' : warn ? '#D97706' : 'var(--accent)'
  const hBg = danger ? '#FEE2E2' : warn ? '#FEF3C7' : 'var(--accent-light)'
  const hText = danger ? '#EF4444' : warn ? '#D97706' : 'var(--accent)'

  return (
    <button title={title} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ height: '26px', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', border: `1.5px solid ${border}`,
        borderRadius: 'var(--rx)', background: bg, color: text,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap', transition: 'all .12s' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = hBorder; e.currentTarget.style.color = hText; e.currentTarget.style.background = hBg } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = text; e.currentTarget.style.background = bg } }}
    >
      {children}
    </button>
  )
}
