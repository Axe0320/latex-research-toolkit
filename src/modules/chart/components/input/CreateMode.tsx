import { useState } from 'react'
import ManualInput from './DataInput/ManualInput'
import SklearnPaste from './DataInput/SklearnPaste'
import CsvUploadButton from '../common/CsvUploadButton'

interface Props {
  data: number[][]
  onDataChange: (data: number[][]) => void
}

type InputMode = 'manual' | 'sklearn'

const TABS: { key: InputMode; label: string }[] = [
  { key: 'manual',  label: '手入力' },
  { key: 'sklearn', label: 'sklearn 貼り付け' },
]

export default function CreateMode({ data, onDataChange }: Props) {
  const [mode, setMode] = useState<InputMode>('manual')

  const handleCsv = (rows: string[][]) => {
    const matrix = rows.map(r => r.map(v => parseFloat(v)).filter(v => !isNaN(v))).filter(r => r.length > 0)
    if (matrix.length > 0) { onDataChange(matrix); setMode('manual') }
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
        <ManualInput data={data} onChange={onDataChange} />
      )}
      {mode === 'sklearn' && (
        <SklearnPaste onParse={(d) => { onDataChange(d); setMode('manual') }} />
      )}
    </div>
  )
}
