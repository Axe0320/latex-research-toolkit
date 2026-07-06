import { useState } from 'react'
import type { PrData } from '../../types/figures'
import ManualSeriesInput, { type SeriesEntry } from './DataInput/ManualSeriesInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: PrData
  onChange: (data: PrData, seriesLabels?: string[]) => void
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

const SAMPLE: PrData = {
  precision: [[1,0.95,0.88,0.80,0.70,0.5],[1,0.90,0.80,0.70,0.60,0.4]],
  recall:    [[0,0.1, 0.3, 0.5, 0.7, 1.0],[0,0.15,0.35,0.55,0.75,1.0]],
  ap: [0.876, 0.742],
}
const SAMPLE_LABELS = ['Class A', 'Class B']

interface SeriesState {
  label: string
  ap: string
  recallText: string
  precisionText: string
}

function initSeries(data: PrData): SeriesState[] {
  return data.precision.map((precision, i) => ({
    label: `Class ${i}`,
    ap: String(data.ap[i] ?? 0),
    precisionText: precision.join('\n'),
    recallText: (data.recall[i] ?? []).join('\n'),
  }))
}

function dataToEntries(data: PrData): SeriesEntry[] {
  return data.recall.map((recall, i) => ({
    label: `Class ${i}`,
    scalar: String(data.ap[i] ?? 0),
    rows: recall.map((r, j) => [String(r), String((data.precision[i] ?? [])[j] ?? '')]),
  }))
}

function entriesToData(entries: SeriesEntry[]): { data: PrData; labels: string[] } {
  return {
    data: {
      recall:    entries.map(e => e.rows.filter(r => r.some(v => v !== '')).map(r => parseFloat(r[0] ?? '') || 0)),
      precision: entries.map(e => e.rows.filter(r => r.some(v => v !== '')).map(r => parseFloat(r[1] ?? '') || 0)),
      ap:        entries.map(e => parseFloat(e.scalar ?? '0') || 0),
    },
    labels: entries.map(e => e.label),
  }
}

export default function PrInput({ data, onChange }: Props) {
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

  const handleApply = (_i: number) => {
    const newPrecision = series.map(s => parseCol(s.precisionText))
    const newRecall    = series.map(s => parseCol(s.recallText))
    const newAp        = series.map(s => parseFloat(s.ap) || 0)
    const labels       = series.map(s => s.label)
    onChange({ precision: newPrecision, recall: newRecall, ap: newAp }, labels)
  }

  const handleAdd = () => {
    setSeries(prev => [...prev, { label: `Class ${prev.length}`, ap: '0', recallText: '', precisionText: '' }])
  }

  const handleRemove = (i: number) => {
    const next = series.filter((_, idx) => idx !== i)
    setSeries(next)
    onChange({ precision: next.map(s => parseCol(s.precisionText)), recall: next.map(s => parseCol(s.recallText)), ap: next.map(s => parseFloat(s.ap) || 0) }, next.map(s => s.label))
  }

  const handleSample = () => {
    setSeries(SAMPLE_LABELS.map((label, i) => ({
      label, ap: String(SAMPLE.ap[i]), precisionText: SAMPLE.precision[i].join('\n'), recallText: SAMPLE.recall[i].join('\n'),
    })))
    onChange(SAMPLE, SAMPLE_LABELS)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualSeriesInput
          key={manualKey}
          col1Header="Recall" col2Header="Precision" scalarLabel="AP"
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
                <label style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>AP</label>
                <input type="number" value={s.ap} onChange={e => updateSeries(i, { ap: e.target.value })} step={0.001} min={0} max={1} style={{ ...inputStyle, padding: '4px 8px', width: 90 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 11, color: '#6B7280' }}>Recall列</label>
                  <textarea rows={5} value={s.recallText} onChange={e => updateSeries(i, { recallText: e.target.value })} style={{ ...inputStyle, padding: '4px 8px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 11, color: '#6B7280' }}>Precision列</label>
                  <textarea rows={5} value={s.precisionText} onChange={e => updateSeries(i, { precisionText: e.target.value })} style={{ ...inputStyle, padding: '4px 8px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
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
