import { useState } from 'react'
import type { ScatterData } from '../../types/figures'
import { parseCsv, toNum } from './DataInput/parseCsv'
import CsvUploadButton from '../common/CsvUploadButton'
import ManualSeriesInput, { type SeriesEntry } from './DataInput/ManualSeriesInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: ScatterData
  onChange: (data: ScatterData, seriesLabels?: string[]) => void
}

const SAMPLE: ScatterData = {
  series: [
    { x: [1, 2, 3, 4, 5, 6, 7, 8], y: [1.2, 2.5, 2.8, 4.1, 4.9, 6.2, 6.8, 8.3] },
    { x: [1, 2, 3, 4, 5, 6, 7, 8], y: [0.8, 1.9, 3.1, 3.8, 5.2, 5.9, 7.1, 7.7] },
  ],
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
  fontSize: 12,
}

function makeLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Series ${i + 1}`)
}

function seriesToText(s: { x: number[]; y: number[] }): string {
  return s.x.map((x, i) => `${x}\t${s.y[i] ?? 0}`).join('\n')
}

function dataToEntries(data: ScatterData): SeriesEntry[] {
  return (data.series ?? []).map((s, i) => ({
    label: `Series ${i + 1}`,
    rows: s.x.map((x, j) => [String(x), String(s.y[j] ?? '')]),
  }))
}

function entriesToData(entries: SeriesEntry[]): ScatterData {
  return {
    series: entries.map(e => {
      const nonEmpty = e.rows.filter(r => r.some(v => v !== ''))
      return {
        x: nonEmpty.map(r => parseFloat(r[0] ?? '') || 0),
        y: nonEmpty.map(r => parseFloat(r[1] ?? '') || 0),
      }
    }),
  }
}

interface SeriesCardProps {
  index: number
  series: { x: number[]; y: number[] }
  canDelete: boolean
  onApply: (index: number, x: number[], y: number[]) => void
  onDelete: (index: number) => void
}

function SeriesCard({ index, series, canDelete, onApply, onDelete }: SeriesCardProps) {
  const [text, setText] = useState(() => seriesToText(series))

  const handleApply = () => {
    const rows = parseCsv(text)
    if (rows.length === 0) return
    const startRow = isNaN(toNum(rows[0]?.[0] ?? '')) ? 1 : 0
    const dataRows = rows.slice(startRow)
    const x = dataRows.map((r) => toNum(r[0] ?? '0'))
    const y = dataRows.map((r) => toNum(r[1] ?? '0'))
    onApply(index, x, y)
  }

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: '#6C63FF' }}>
          系列{index + 1}: {series.x.length}点
        </span>
        {canDelete && (
          <button
            onClick={() => onDelete(index)}
            className="text-xs px-2 py-0.5 rounded transition-all"
            style={{ color: '#EF4444', border: '1px solid #FCA5A5', background: 'white' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
          >
            削除
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400">CSV / TSV（1列目: x、2列目: y）</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full p-2 text-xs font-mono resize-y"
        style={{ ...inputStyle, borderRadius: 8, background: 'white' }}
        placeholder={'1\t1.2\n2\t2.5\n3\t2.8'}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
      />
      <button
        onClick={handleApply}
        className="w-full py-1.5 text-xs font-semibold text-white rounded-lg transition-all"
        style={{ background: '#6C63FF' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF' }}
      >
        適用
      </button>
    </div>
  )
}

export default function ScatterInput({ data, onChange }: Props) {
  const [series, setSeries] = useState((data.series?.length ?? 0) > 0 ? data.series : [{ x: [] as number[], y: [] as number[] }])
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') setManualKey(k => k + 1)
    setMode(m)
  }

  const emit = (next: typeof series) => {
    onChange({ series: next }, makeLabels(next.length))
  }

  const handleManualChange = (entries: SeriesEntry[]) => {
    const next = entriesToData(entries).series
    setSeries(next)
    onChange({ series: next }, entries.map(e => e.label))
  }

  const handleApply = (index: number, x: number[], y: number[]) => {
    const next = series.map((s, i) => i === index ? { x, y } : s)
    setSeries(next); emit(next)
  }

  const handleDelete = (index: number) => {
    const next = series.filter((_, i) => i !== index)
    setSeries(next); emit(next)
  }

  const handleAdd = () => {
    const next = [...series, { x: [] as number[], y: [] as number[] }]
    setSeries(next); emit(next)
  }

  const handleSample = () => {
    setSeries(SAMPLE.series)
    onChange(SAMPLE, makeLabels(SAMPLE.series.length))
  }

  const handleCsv = (rows: string[][]) => {
    if (rows.length === 0) return
    const startRow = isNaN(toNum(rows[0]?.[0] ?? '')) ? 1 : 0
    const dr = rows.slice(startRow)
    const nSeries = (dr[0]?.length ?? 1) - 1
    if (nSeries <= 1) {
      const next = [{ x: dr.map(r => toNum(r[0] ?? '0')), y: dr.map(r => toNum(r[1] ?? '0')) }]
      setSeries(next); emit(next)
    } else {
      const xs = dr.map(r => toNum(r[0] ?? '0'))
      const next = Array.from({ length: nSeries }, (_, si) => ({
        x: xs, y: dr.map(r => toNum(r[si + 1] ?? '0')),
      }))
      setSeries(next); emit(next)
    }
  }

  return (
    <div className="space-y-3">
      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualSeriesInput
          key={manualKey}
          col1Header="x" col2Header="y"
          initSeries={dataToEntries(data)}
          onChange={handleManualChange}
        />
      )}

      {mode === 'paste' && (
        <>
          {series.map((s, i) => (
            <SeriesCard
              key={i} index={i} series={s}
              canDelete={series.length > 1}
              onApply={handleApply}
              onDelete={handleDelete}
            />
          ))}
          <button
            onClick={handleAdd}
            className="w-full py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{ border: '1px solid #C4B5FD', color: '#6C63FF', background: 'white' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F3FF' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
          >
            ＋ 系列を追加
          </button>
          <div className="flex gap-2">
            <CsvUploadButton onParse={handleCsv} label="CSVで読み込む" />
          </div>
        </>
      )}

      <button
        onClick={handleSample}
        className="w-full py-1.5 text-xs rounded-lg transition-all"
        style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: 'white' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4B5FD' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}
      >
        サンプルデータを読み込む（2系列）
      </button>
    </div>
  )
}
