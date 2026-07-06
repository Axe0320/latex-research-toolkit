import { useState } from 'react'
import HeatmapManualInput from './DataInput/HeatmapManualInput'
import CorrelationPaste from './DataInput/CorrelationPaste'
import CsvUploadButton from '../common/CsvUploadButton'

interface Props {
  data: number[][]
  onDataChange: (data: number[][], labels?: { x: string[], y: string[] }) => void
}

type InputMode = 'manual' | 'paste'

const TABS: { key: InputMode; label: string }[] = [
  { key: 'manual', label: '手入力' },
  { key: 'paste',  label: '行列貼り付け' },
]

export default function HeatmapCreateMode({ data, onDataChange }: Props) {
  const [mode, setMode] = useState<InputMode>('manual')

  const handlePaste = (parsed: number[][], labels: string[] | null) => {
    if (labels) {
      const rows = parsed.length
      const cols = parsed[0]?.length ?? 0
      const labelsX = labels.slice(0, cols)
      const labelsY = rows === cols && labels.length === rows
        ? labels
        : labels.slice(0, rows)
      onDataChange(parsed, { x: labelsX, y: labelsY })
    } else {
      onDataChange(parsed)
    }
    setMode('manual')
  }

  const handleCsv = (rows: string[][]) => {
    if (rows.length === 0) return
    // 1行目が非数値ならX軸ラベル、1列目が非数値ならY軸ラベル
    const hasColHeader = rows.length > 1 && isNaN(parseFloat(rows[0][0] ?? ''))
    const hasRowHeader = isNaN(parseFloat(rows[hasColHeader ? 1 : 0]?.[0] ?? ''))
    const colStart = hasRowHeader ? 1 : 0
    const rowStart = hasColHeader ? 1 : 0
    const labelsX = hasColHeader ? rows[0].slice(colStart) : undefined
    const labelsY = hasRowHeader ? rows.slice(rowStart).map(r => r[0]) : undefined
    const matrix = rows.slice(rowStart).map(r =>
      r.slice(colStart).map(v => parseFloat(v)).filter(v => !isNaN(v))
    ).filter(r => r.length > 0)
    if (matrix.length > 0) {
      onDataChange(matrix, labelsX && labelsY ? { x: labelsX, y: labelsY } : undefined)
      setMode('manual')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-gray-200 pb-0">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className="px-3 py-1.5 text-xs font-semibold border-b-2 -mb-px transition-colors"
              style={{
                borderBottomColor: mode === t.key ? '#6C63FF' : 'transparent',
                color: mode === t.key ? '#6C63FF' : '#6B7280',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CsvUploadButton onParse={handleCsv} label="CSVで読み込む" />
      </div>

      {mode === 'manual' && (
        <HeatmapManualInput data={data} onChange={onDataChange} />
      )}
      {mode === 'paste' && (
        <CorrelationPaste onParse={handlePaste} />
      )}
    </div>
  )
}
