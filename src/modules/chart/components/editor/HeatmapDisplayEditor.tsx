import type { HeatmapParams } from '../../types/figures'

interface Props {
  params: HeatmapParams
  onChange: (patch: Partial<HeatmapParams>) => void
}

const COLORMAPS_SEQUENTIAL = [
  { value: 'Blues',   label: 'Blues' },
  { value: 'Reds',    label: 'Reds' },
  { value: 'Greens',  label: 'Greens' },
  { value: 'Oranges', label: 'Oranges' },
  { value: 'Purples', label: 'Purples' },
  { value: 'YlOrRd',  label: 'YlOrRd' },
  { value: 'viridis', label: 'viridis' },
  { value: 'plasma',  label: 'plasma' },
]
const COLORMAPS_DIVERGING = [
  { value: 'coolwarm', label: 'coolwarm' },
  { value: 'RdBu',     label: 'RdBu' },
  { value: 'RdYlBu',   label: 'RdYlBu' },
  { value: 'bwr',      label: 'bwr' },
]

const FMT_OPTIONS = [
  { value: '.2f', label: '.2f  →  0.75' },
  { value: '.3f', label: '.3f  →  0.750' },
  { value: '.1f', label: '.1f  →  0.8' },
  { value: '.0f', label: '.0f  →  1' },
  { value: 'g',   label: 'g    →  0.75' },
  { value: 'd',   label: 'd    →  整数' },
]

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function HeatmapDisplayEditor({ params, onChange }: Props) {
  const setMode = (mode: 'heatmap' | 'correlation') => {
    if (mode === 'correlation') {
      onChange({ mode, colormap: 'coolwarm', vmin: -1, vmax: 1 })
    } else {
      onChange({ mode, colormap: 'Blues', vmin: null, vmax: null })
    }
  }

  const colormaps = params.mode === 'correlation' ? COLORMAPS_DIVERGING : COLORMAPS_SEQUENTIAL

  return (
    <div className="space-y-3">
      {/* Mode */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">モード</label>
        <div className="flex gap-1.5">
          {([['heatmap', 'ヒートマップ'], ['correlation', '相関行列']] as ['heatmap' | 'correlation', string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="flex-1 py-1 text-xs font-medium transition-all"
              style={{
                border: params.mode === key ? '1px solid #6C63FF' : '1px solid #E5E7EB',
                borderRadius: 8,
                background: params.mode === key ? '#EEF2FF' : 'white',
                color: params.mode === key ? '#6C63FF' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Colormap */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">カラーマップ</label>
        <select
          value={params.colormap}
          onChange={(e) => onChange({ colormap: e.target.value })}
          className="w-full text-sm px-3 py-1.5"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
        >
          {colormaps.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* vmin / vmax */}
      {params.mode === 'heatmap' ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">最小値</label>
            <input
              type="number"
              value={params.vmin ?? ''}
              onChange={(e) => onChange({ vmin: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="自動"
              className="w-full text-sm px-2 py-1.5"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">最大値</label>
            <input
              type="number"
              value={params.vmax ?? ''}
              onChange={(e) => onChange({ vmax: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="自動"
              className="w-full text-sm px-2 py-1.5"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded">
          相関行列モード: 値範囲 -1〜1 固定
        </p>
      )}

      {/* mask_upper */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={params.mask_upper}
          onChange={(e) => onChange({ mask_upper: e.target.checked })}
          className="accent-[#6C63FF]"
        />
        <span className="text-sm text-gray-700">上三角マスク（相関行列向け）</span>
      </label>

      {/* show_values + fmt */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={params.show_values}
          onChange={(e) => onChange({ show_values: e.target.checked })}
          className="accent-[#6C63FF]"
        />
        <span className="text-sm text-gray-700">値を表示</span>
      </label>
      {params.show_values && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">数値フォーマット</label>
          <select
            value={params.fmt}
            onChange={(e) => onChange({ fmt: e.target.value })}
            className="w-full text-sm px-3 py-1.5"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
          >
            {FMT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
