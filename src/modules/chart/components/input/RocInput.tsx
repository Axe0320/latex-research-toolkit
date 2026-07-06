import { useState } from 'react'
import type { RocData } from '../../types/figures'
import ManualSeriesInput, { type SeriesEntry } from './DataInput/ManualSeriesInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: RocData
  onChange: (data: RocData, seriesLabels?: string[]) => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
  transition: 'border-color 0.15s', fontSize: 12,
}

const btnPrimary = (hover: boolean): React.CSSProperties => ({
  background: hover ? '#5a52e0' : '#6C63FF',
  color: 'white', borderRadius: 8, padding: '6px 0', fontSize: 12,
  fontWeight: 600, width: '100%', cursor: 'pointer', border: 'none',
})

function parseCol(text: string): number[] {
  return text.split(/[\n,\t]+/).map(s => s.trim()).filter(Boolean)
    .map(Number).filter(n => !isNaN(n))
}

const SAMPLE: RocData = {
  fpr: [[0,0.05,0.1,0.2,0.3,0.5,1], [0,0.1,0.2,0.4,0.6,0.8,1]],
  tpr: [[0,0.4,0.7,0.85,0.9,0.95,1],[0,0.3,0.6,0.75,0.85,0.92,1]],
  auc: [0.912, 0.847],
}
const SAMPLE_LABELS = ['Class A', 'Class B']

interface SeriesState {
  label: string
  auc: string
  fprText: string
  tprText: string
}

function initSeries(data: RocData): SeriesState[] {
  return data.fpr.map((fpr, i) => ({
    label: `Class ${i}`,
    auc: String(data.auc[i] ?? 0),
    fprText: fpr.join('\n'),
    tprText: (data.tpr[i] ?? []).join('\n'),
  }))
}

function dataToEntries(data: RocData): SeriesEntry[] {
  return data.fpr.map((fpr, i) => ({
    label: `Class ${i}`,
    scalar: String(data.auc[i] ?? 0),
    rows: fpr.map((f, j) => [String(f), String((data.tpr[i] ?? [])[j] ?? '')]),
  }))
}

function entriesToData(entries: SeriesEntry[]): { data: RocData; labels: string[] } {
  return {
    data: {
      fpr: entries.map(e => e.rows.filter(r => r.some(v => v !== '')).map(r => parseFloat(r[0] ?? '') || 0)),
      tpr: entries.map(e => e.rows.filter(r => r.some(v => v !== '')).map(r => parseFloat(r[1] ?? '') || 0)),
      auc: entries.map(e => parseFloat(e.scalar ?? '0') || 0),
    },
    labels: entries.map(e => e.label),
  }
}

export default function RocInput({ data, onChange }: Props) {
  const [series, setSeries] = useState<SeriesState[]>(() => initSeries(data))
  const [hoverApply, setHoverApply] = useState<number | null>(null)
  const [hoverAdd, setHoverAdd] = useState(false)
  const [hoverSample, setHoverSample] = useState(false)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') setManualKey(k => k + 1)
    setMode(m)
  }

  const handleManualChange = (entries: SeriesEntry[]) => {
    const { data: d, labels } = entriesToData(entries)
    onChange(d, labels)
  }

  const updateSeries = (i: number, patch: Partial<SeriesState>) => {
    setSeries(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  const handleApply = (i: number) => {
    const s = series[i]
    const newFpr = series.map((s2, idx) => idx === i ? parseCol(s.fprText) : parseCol(s2.fprText))
    const newTpr = series.map((s2, idx) => idx === i ? parseCol(s.tprText) : parseCol(s2.tprText))
    const newAuc = series.map(s2 => parseFloat(s2.auc) || 0)
    const labels = series.map(s2 => s2.label)
    onChange({ fpr: newFpr, tpr: newTpr, auc: newAuc }, labels)
  }

  const handleAdd = () => {
    setSeries(prev => [...prev, { label: `Class ${prev.length}`, auc: '0', fprText: '', tprText: '' }])
  }

  const handleRemove = (i: number) => {
    const next = series.filter((_, idx) => idx !== i)
    setSeries(next)
    onChange({ fpr: next.map(s => parseCol(s.fprText)), tpr: next.map(s => parseCol(s.tprText)), auc: next.map(s => parseFloat(s.auc) || 0) }, next.map(s => s.label))
  }

  const handleSample = () => {
    setSeries(SAMPLE_LABELS.map((label, i) => ({
      label, auc: String(SAMPLE.auc[i]), fprText: SAMPLE.fpr[i].join('\n'), tprText: SAMPLE.tpr[i].join('\n'),
    })))
    onChange(SAMPLE, SAMPLE_LABELS)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualSeriesInput
          key={manualKey}
          col1Header="FPR" col2Header="TPR" scalarLabel="AUC"
          initSeries={dataToEntries(data)}
          onChange={handleManualChange}
        />
      )}

      {mode === 'paste' && (
        <>
          {series.map((s, i) => (
            <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>系列 {i + 1}</span>
                {series.length > 1 && (
                  <button onClick={() => handleRemove(i)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>削除</button>
                )}
              </div>
              <input type="text" value={s.label} onChange={e => updateSeries(i, { label: e.target.value })} placeholder="系列名" style={{ ...inputStyle, padding: '4px 8px', width: '100%', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>AUC</label>
                <input type="number" value={s.auc} onChange={e => updateSeries(i, { auc: e.target.value })} step={0.001} min={0} max={1} style={{ ...inputStyle, padding: '4px 8px', width: 90 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 11, color: '#6B7280' }}>FPR列</label>
                  <textarea rows={5} value={s.fprText} onChange={e => updateSeries(i, { fprText: e.target.value })} style={{ ...inputStyle, padding: '4px 8px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 11, color: '#6B7280' }}>TPR列</label>
                  <textarea rows={5} value={s.tprText} onChange={e => updateSeries(i, { tprText: e.target.value })} style={{ ...inputStyle, padding: '4px 8px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={() => handleApply(i)} onMouseEnter={() => setHoverApply(i)} onMouseLeave={() => setHoverApply(null)} style={btnPrimary(hoverApply === i)}>適用</button>
            </div>
          ))}
          <button onClick={handleAdd} onMouseEnter={() => setHoverAdd(true)} onMouseLeave={() => setHoverAdd(false)}
            style={{ border: '1px dashed #6C63FF', borderRadius: 8, padding: '6px 0', fontSize: 12, color: hoverAdd ? '#5a52e0' : '#6C63FF', background: 'none', cursor: 'pointer', width: '100%' }}>
            ＋ 系列を追加
          </button>
        </>
      )}

      <button onClick={handleSample} onMouseEnter={() => setHoverSample(true)} onMouseLeave={() => setHoverSample(false)}
        style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 0', fontSize: 12, color: '#6B7280', background: hoverSample ? '#F9FAFB' : 'white', cursor: 'pointer', width: '100%' }}>
        サンプルデータ
      </button>
    </div>
  )
}
