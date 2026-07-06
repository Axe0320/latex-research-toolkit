import { useRef } from 'react'
import type { ComboData } from '../../../types/figures'
import ManualTableInput from './ManualTableInput'

interface Props {
  initData: ComboData
  onChange: (data: ComboData) => void
}

function barDataToInit(data: ComboData): { rows: string[][]; seriesNames: string[] } {
  const rows = data.labels.map((l, i) =>
    [l, ...data.bar_series.map(s => String(s.values[i] ?? ''))]
  )
  const seriesNames = data.bar_series.map(s => s.name)
  return { rows, seriesNames }
}

function lineDataToInit(data: ComboData): { rows: string[][]; seriesNames: string[] } {
  const rows = data.labels.map((l, i) =>
    [l, ...data.line_series.map(s => String(s.values[i] ?? ''))]
  )
  const seriesNames = data.line_series.map(s => s.name)
  return { rows, seriesNames }
}

export default function ManualComboInput({ initData, onChange }: Props) {
  const barRef  = useRef<{ rows: string[][]; seriesNames: string[] }>(barDataToInit(initData))
  const lineRef = useRef<{ rows: string[][]; seriesNames: string[] }>(lineDataToInit(initData))

  const emit = () => {
    const { rows: bRows, seriesNames: bNames } = barRef.current
    const { rows: lRows, seriesNames: lNames } = lineRef.current
    const labels = bRows.map(r => r[0] || '')
    onChange({
      labels,
      bar_series:  bNames.map((name, si) => ({ name, values: bRows.map(r => parseFloat(r[si + 1] ?? '') || 0) })),
      line_series: lNames.map((name, si) => ({ name, values: lRows.map(r => parseFloat(r[si + 1] ?? '') || 0) })),
    })
  }

  const handleBarChange  = (rows: string[][], seriesNames: string[]) => { barRef.current  = { rows, seriesNames }; emit() }
  const handleLineChange = (rows: string[][], seriesNames: string[]) => { lineRef.current = { rows, seriesNames }; emit() }

  const barInit  = barDataToInit(initData)
  const lineInit = lineDataToInit(initData)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>棒グラフデータ（ラベル + 棒系列）</p>
        <ManualTableInput
          firstColHeader="ラベル" firstColType="text"
          initRows={barInit.rows} initSeriesNames={barInit.seriesNames}
          onChange={handleBarChange}
        />
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>折れ線データ（ラベル + 折線系列）</p>
        <ManualTableInput
          firstColHeader="ラベル" firstColType="text"
          initRows={lineInit.rows} initSeriesNames={lineInit.seriesNames}
          onChange={handleLineChange}
        />
      </div>
    </div>
  )
}
