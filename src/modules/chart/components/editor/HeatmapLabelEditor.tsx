import type { HeatmapParams } from '../../types/figures'
import ImeInput from '../common/ImeInput'

interface Props {
  params: HeatmapParams
  dataRows: number
  dataCols: number
  onChange: (patch: Partial<HeatmapParams>) => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

function LabelList({
  title,
  labels,
  onSetLabel,
}: {
  title: string
  labels: string[]
  onSetLabel: (i: number, val: string) => void
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-2">
        改行は{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">\n</code>
        {' '}で入力
      </p>
      <div className="space-y-1.5">
        {labels.map((label, i) => {
          const lines = label.split('\\n')
          const hasNewline = lines.length > 1
          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{i}</span>
                <ImeInput
                  value={label}
                  onValueChange={(val) => onSetLabel(i, val)}
                  className="flex-1 text-sm px-2 py-1"
                />
              </div>
              {hasNewline && (
                <div className="ml-6 mt-1 flex flex-wrap gap-1">
                  {lines.map((line, li) => (
                    <span
                      key={li}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: '#EEF2FF', color: '#6C63FF' }}
                    >
                      {line || '(空)'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HeatmapLabelEditor({ params, dataRows, dataCols, onChange }: Props) {
  const labelsX = Array.from({ length: dataCols }, (_, i) => params.labels_x[i] ?? `Col ${i}`)
  const labelsY = Array.from({ length: dataRows }, (_, i) => params.labels_y[i] ?? `Row ${i}`)

  const setLabelX = (i: number, val: string) => {
    const next = [...labelsX]
    next[i] = val
    onChange({ labels_x: next })
  }

  const setLabelY = (i: number, val: string) => {
    const next = [...labelsY]
    next[i] = val
    onChange({ labels_y: next })
  }

  return (
    <div className="space-y-4">
      {/* 軸ラベル */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">軸ラベル</p>
        <div>
          <label className="block text-xs text-gray-400 mb-1">x軸（列方向）</label>
          <ImeInput
            value={params.xlabel}
            onValueChange={(xlabel) => onChange({ xlabel })}
            className="w-full text-sm px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">y軸（行方向）</label>
          <ImeInput
            value={params.ylabel}
            onValueChange={(ylabel) => onChange({ ylabel })}
            className="w-full text-sm px-2 py-1.5"
          />
        </div>
      </div>

      {/* Column labels (labels_x) */}
      <LabelList title={`列ラベル（${dataCols}個）`} labels={labelsX} onSetLabel={setLabelX} />

      {/* Row labels (labels_y) */}
      <LabelList title={`行ラベル（${dataRows}個）`} labels={labelsY} onSetLabel={setLabelY} />

      {/* 罫線 */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">罫線</p>
        <div>
          <label className="block text-xs text-gray-400 mb-1">太さ (px)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0} max={5} step={0.05}
              value={params.linewidths}
              onChange={(e) => onChange({ linewidths: Number(e.target.value) })}
              className="flex-1 accent-[#6C63FF]"
            />
            <input
              type="number"
              min={0} max={5} step={0.05}
              value={params.linewidths}
              onChange={(e) => {
                const v = Math.max(0, Math.min(5, Number(e.target.value)))
                if (!isNaN(v)) onChange({ linewidths: v })
              }}
              className="w-16 text-sm text-center px-1 py-1"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>なし (0)</span><span>太 (5)</span>
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-xs text-gray-400 mb-1">罫線の色</label>
          <div className="flex gap-2">
            {['white', 'black', 'gray', 'lightgray'].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ linecolor: c })}
                title={c}
                className="w-7 h-7 rounded transition-all"
                style={{
                  background: c,
                  border: params.linecolor === c ? '2px solid #6C63FF' : '2px solid #D1D5DB',
                  transform: params.linecolor === c ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
