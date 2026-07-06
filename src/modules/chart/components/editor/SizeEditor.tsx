import type { BaseFigureParams } from '../../types/figures'

type ExtendedParams = BaseFigureParams & {
  cell_size_cm?: number | null
}

interface Props {
  params: ExtendedParams
  onChange: (patch: Partial<ExtendedParams>) => void
}

const DPI_OPTIONS = [72, 150, 300]

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

function NumInput({
  value, min, max, step = 0.5,
  onChange,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (!isNaN(v) && v >= min && v <= max) onChange(v)
      }}
      className="w-full text-sm px-2 py-1.5"
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
    />
  )
}

type SizeMode = 'figure' | 'cell'

export default function SizeEditor({ params, onChange }: Props) {
  const mode: SizeMode =
    params.cell_size_cm !== null && params.cell_size_cm !== undefined ? 'cell' : 'figure'

  const setMode = (m: SizeMode) => {
    if (m === 'cell') onChange({ cell_size_cm: 1.5 })
    else              onChange({ cell_size_cm: null })
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">サイズ指定方法</label>
        <div className="flex gap-1.5">
          {([['figure', '図全体'], ['cell', 'セル単位']] as [SizeMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="flex-1 py-1 text-xs font-medium transition-all"
              style={{
                border: mode === key ? '1px solid #6C63FF' : '1px solid #E5E7EB',
                borderRadius: 8,
                background: mode === key ? '#EEF2FF' : 'white',
                color: mode === key ? '#6C63FF' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          {mode === 'figure'
            ? '出力画像全体（行列＋カラーバー＋ラベル＋タイトル）のサイズ'
            : '各セル1つのサイズを指定 → 図全体サイズは自動計算'}
        </p>
      </div>

      {mode === 'figure' ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">幅 (cm)</label>
            <NumInput
              value={params.figsize_cm[0]} min={3} max={40} step={0.5}
              onChange={(v) => onChange({ figsize_cm: [v, params.figsize_cm[1]] })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">高さ (cm)</label>
            <NumInput
              value={params.figsize_cm[1]} min={3} max={40} step={0.5}
              onChange={(v) => onChange({ figsize_cm: [params.figsize_cm[0], v] })}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs text-gray-500 mb-1">セルサイズ (cm)</label>
          <NumInput
            value={params.cell_size_cm ?? 1.5} min={0.3} max={5} step={0.1}
            onChange={(v) => onChange({ cell_size_cm: v })}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            推奨: 1.0〜2.0cm
          </p>
        </div>
      )}

      {/* DPI */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          DPI <span className="text-gray-400 font-normal">（Web=150, 論文=300）</span>
        </label>
        <div className="flex gap-2">
          {DPI_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ dpi: d })}
              className="flex-1 py-1 text-sm font-medium transition-all"
              style={{
                border: params.dpi === d ? '1px solid #6C63FF' : '1px solid #E5E7EB',
                borderRadius: 8,
                background: params.dpi === d ? '#EEF2FF' : 'white',
                color: params.dpi === d ? '#6C63FF' : '#6B7280',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
