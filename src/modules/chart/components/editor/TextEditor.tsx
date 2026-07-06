import type { BaseFigureParams } from '../../types/figures'
import ImeInput from '../common/ImeInput'

type ExtendedParams = BaseFigureParams & {
  annot_fontsize?: number
  tick_fontsize?: number
}

interface Props {
  params: ExtendedParams
  onChange: (patch: Partial<ExtendedParams>) => void
}

const numInputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function FontSlider({
  label, value, min = 6, max = 24,
  onChange,
}: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[#6C63FF]"
        />
        <input
          type="number"
          min={min} max={max} step={1}
          value={value}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), min, max)
            if (!isNaN(v)) onChange(v)
          }}
          className="w-14 text-sm text-center px-1 py-1"
          style={numInputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
        />
        <span className="text-xs text-gray-400 w-4">pt</span>
      </div>
    </div>
  )
}

export default function TextEditor({ params, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">タイトル</label>
        <ImeInput
          value={params.title}
          onValueChange={(title) => onChange({ title })}
          placeholder="タイトルなし"
          className="w-full text-sm px-3 py-1.5"
        />
      </div>
      <FontSlider
        label="タイトル・軸ラベルサイズ"
        value={params.fontsize}
        min={8} max={24}
        onChange={(fontsize) => onChange({ fontsize })}
      />
      {params.annot_fontsize !== undefined && (
        <FontSlider
          label="セル内数値サイズ"
          value={params.annot_fontsize}
          min={6} max={24}
          onChange={(annot_fontsize) => onChange({ annot_fontsize })}
        />
      )}
      {params.tick_fontsize !== undefined && (
        <FontSlider
          label="クラスラベルサイズ"
          value={params.tick_fontsize}
          min={6} max={24}
          onChange={(tick_fontsize) => onChange({ tick_fontsize })}
        />
      )}
    </div>
  )
}
