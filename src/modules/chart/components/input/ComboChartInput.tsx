import { useState, useRef } from 'react'
import type { ComboData } from '../../types/figures'
import { parseCsv, toNum } from './DataInput/parseCsv'
import CsvUploadButton from '../common/CsvUploadButton'
import ManualComboInput from './DataInput/ManualComboInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: ComboData
  onChange: (data: ComboData) => void
}

const SAMPLE: ComboData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  bar_series:  [{ name: '売上', values: [100, 150, 130, 200] }],
  line_series: [{ name: '成長率', values: [0.10, 0.50, -0.13, 0.54] }],
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
  transition: 'border-color 0.15s', fontSize: 12,
}

function parseSection(rows: string[][]): { labels: string[]; series: { name: string; values: number[] }[] } {
  let startRow = 0
  const names: string[] = []
  if (rows.length > 1 && isNaN(toNum(rows[0][1] ?? ''))) {
    names.push(...rows[0].slice(1))
    startRow = 1
  }
  const dr     = rows.slice(startRow)
  const labels = dr.map((r) => r[0])
  const n      = (dr[0]?.length ?? 1) - 1
  const series = Array.from({ length: Math.max(n, 1) }, (_, i) => ({
    name:   names[i] ?? `Series ${i + 1}`,
    values: dr.map((r) => toNum(r[i + 1] ?? '0')),
  }))
  return { labels, series }
}

export default function ComboChartInput({ data, onChange }: Props) {
  const barRef  = useRef<HTMLTextAreaElement>(null)
  const lineRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') setManualKey(k => k + 1)
    setMode(m)
  }

  const applyBar = () => {
    const rows = parseCsv(barRef.current?.value ?? '')
    if (rows.length === 0) return
    const { labels, series } = parseSection(rows)
    onChange({ ...data, labels, bar_series: series })
    if (barRef.current) barRef.current.value = ''
  }

  const applyLine = () => {
    const rows = parseCsv(lineRef.current?.value ?? '')
    if (rows.length === 0) return
    const { series } = parseSection(rows)
    onChange({ ...data, line_series: series })
    if (lineRef.current) lineRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 px-3 py-2 rounded-lg" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
        {data.labels.length} カテゴリ｜棒: {data.bar_series.length} 系列｜折れ線: {data.line_series.length} 系列
      </div>

      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualComboInput key={manualKey} initData={data} onChange={onChange} />
      )}

      {mode === 'paste' && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-gray-500">棒グラフデータ（ラベル + 値）</p>
              <CsvUploadButton onParse={(rows) => {
                if (rows.length === 0) return
                const { labels, series } = parseSection(rows)
                onChange({ ...data, labels, bar_series: series })
              }} />
            </div>
            <textarea
              ref={barRef}
              rows={4}
              className="w-full p-2 text-xs font-mono resize-y"
              style={{ ...inputStyle, borderRadius: 8 }}
              placeholder={'Q1\t100\nQ2\t150\nQ3\t130\nQ4\t200'}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
            <button onClick={applyBar} className="mt-1 w-full py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: '#6C63FF' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF' }}>
              棒データを適用
            </button>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1">折れ線データ（値のみ、カテゴリは棒グラフと共有）</p>
            <textarea
              ref={lineRef}
              rows={4}
              className="w-full p-2 text-xs font-mono resize-y"
              style={{ ...inputStyle, borderRadius: 8 }}
              placeholder={'成長率\n0.10\n0.50\n-0.13\n0.54'}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
            <button onClick={applyLine} className="mt-1 w-full py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: '#6C63FF' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF' }}>
              折れ線データを適用
            </button>
          </div>
        </>
      )}

      <button
        onClick={() => onChange(SAMPLE)}
        className="w-full py-1.5 text-xs rounded-lg transition-all"
        style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: 'white' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4B5FD' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}
      >
        サンプルデータを読み込む
      </button>
    </div>
  )
}
