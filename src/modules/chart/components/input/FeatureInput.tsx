import { useState } from 'react'
import type { FeatureData } from '../../types/figures'
import CsvUploadButton from '../common/CsvUploadButton'
import SpreadsheetTable, { type SpreadsheetColumn } from './DataInput/SpreadsheetTable'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: FeatureData
  onChange: (data: FeatureData) => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
  transition: 'border-color 0.15s', fontSize: 12,
}

const SAMPLE: FeatureData = {
  features:    ['Feature A','Feature B','Feature C','Feature D','Feature E','Feature F','Feature G','Feature H'],
  importances: [0.25, 0.18, 0.15, 0.12, 0.10, 0.08, 0.07, 0.05],
}

const SAMPLE_TEXT = SAMPLE.features.map((f, i) => `${f}\t${SAMPLE.importances[i]}`).join('\n')

const COLS: SpreadsheetColumn[] = [
  { header: '特徴量名', bg: 'fixed', type: 'text', width: 100 },
  { header: '重要度',   bg: 'series', type: 'number', width: 70 },
]

function parseFeatureText(text: string): FeatureData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { features: [], importances: [] }
  const features: string[] = []
  const importances: number[] = []
  let startIdx = 0
  const firstCols = lines[0].split(/[\t,]/)
  if (firstCols.length >= 2 && isNaN(Number(firstCols[1]))) startIdx = 1
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(/[\t,]/)
    if (cols.length < 2) continue
    const val = Number(cols[1].trim())
    if (!isNaN(val)) { features.push(cols[0].trim()); importances.push(val) }
  }
  return { features, importances }
}

function dataToRows(data: FeatureData): string[][] {
  return data.features.map((f, i) => [f, String(data.importances[i] ?? '')])
}

export default function FeatureInput({ data, onChange }: Props) {
  const [text, setText] = useState(() =>
    data.features.map((f, i) => `${f}\t${data.importances[i]}`).join('\n')
  )
  const [hoverApply, setHoverApply] = useState(false)
  const [hoverSample, setHoverSample] = useState(false)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)
  const [manualRows, setManualRows] = useState<string[][]>(() => dataToRows(data))

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') {
      setManualRows(dataToRows(data))
      setManualKey(k => k + 1)
    }
    setMode(m)
  }

  const handleManualChange = (rows: string[][]) => {
    setManualRows(rows)
    const nonEmpty = rows.filter(r => r.some(v => v !== ''))
    onChange({
      features:    nonEmpty.map(r => r[0] || ''),
      importances: nonEmpty.map(r => parseFloat(r[1] ?? '') || 0),
    })
  }

  const handleApply = () => {
    const parsed = parseFeatureText(text)
    onChange(parsed)
  }

  const handleSample = () => {
    setText(SAMPLE_TEXT)
    onChange(SAMPLE)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: '#6B7280' }}>{data.features.length} 件</div>

      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <SpreadsheetTable key={manualKey} columns={COLS} rows={manualRows} onChange={handleManualChange} />
      )}

      {mode === 'paste' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>CSV/TSV（1列目: 特徴量名、2列目: 重要度）</p>
            <CsvUploadButton onParse={(rows) => {
              const features: string[] = []; const importances: number[] = []
              const start = rows.length > 1 && isNaN(Number(rows[0]?.[1]?.trim())) ? 1 : 0
              rows.slice(start).forEach(r => { if (r.length >= 2) { const v = Number(r[1].trim()); if (!isNaN(v)) { features.push(r[0]); importances.push(v) } } })
              if (features.length > 0) { const d = { features, importances }; setText(features.map((f, i) => `${f}\t${importances[i]}`).join('\n')); onChange(d) }
            }} />
          </div>
          <textarea
            rows={6}
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ ...inputStyle, padding: '6px 8px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleApply}
            onMouseEnter={() => setHoverApply(true)}
            onMouseLeave={() => setHoverApply(false)}
            style={{
              background: hoverApply ? '#5a52e0' : '#6C63FF',
              color: 'white', borderRadius: 8, padding: '6px 0', fontSize: 12,
              fontWeight: 600, width: '100%', cursor: 'pointer', border: 'none',
            }}
          >
            データを適用
          </button>
        </>
      )}

      <button
        onClick={handleSample}
        onMouseEnter={() => setHoverSample(true)}
        onMouseLeave={() => setHoverSample(false)}
        style={{
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 0', fontSize: 12,
          color: '#6B7280', background: hoverSample ? '#F9FAFB' : 'white', cursor: 'pointer', width: '100%',
        }}
      >
        サンプルデータ
      </button>
    </div>
  )
}
