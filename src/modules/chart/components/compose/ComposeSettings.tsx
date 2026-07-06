import type { FigureState, ComposeLayout } from '../../types/figures'

type ComposeFormat = 'png' | 'svg' | 'pdf'

interface Props {
  figures: FigureState[]
  layout: ComposeLayout
  onLayoutChange: (patch: Partial<ComposeLayout>) => void
  onReorder: (fromIdx: number, toIdx: number) => void
  onExport: () => void
  onFormatChange: (fmt: ComposeFormat) => void
  format: ComposeFormat
  exporting: boolean
}

const TYPE_LABEL: Record<string, string> = {
  confusion_matrix: '混合行列',
  heatmap: 'ヒートマップ',
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid #6C63FF' : '1px solid #E5E7EB',
  borderRadius: 8,
  background: active ? '#EEF2FF' : 'white',
  color: active ? '#6C63FF' : '#6B7280',
  padding: '4px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
})

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function ComposeSettings({
  figures,
  layout,
  onLayoutChange,
  onReorder,
  onExport,
  onFormatChange,
  format,
  exporting,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Grid columns / rows */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">列数</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onLayoutChange({ gridCols: n })}
              style={btnStyle(layout.gridCols === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5">
          行数
          <span className="ml-1 text-[10px] text-gray-400">(0 = 自動)</span>
        </label>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onLayoutChange({ gridRows: n })}
              style={btnStyle(layout.gridRows === n)}
            >
              {n === 0 ? '自動' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Gap */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">間隔 (cm)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0} max={2} step={0.1}
            value={layout.gap}
            onChange={(e) => onLayoutChange({ gap: Number(e.target.value) })}
            className="flex-1 accent-[#6C63FF]"
          />
          <input
            type="number"
            min={0} max={2} step={0.1}
            value={layout.gap}
            onChange={(e) => {
              const v = Math.max(0, Math.min(2, Number(e.target.value)))
              if (!isNaN(v)) onLayoutChange({ gap: v })
            }}
            className="w-14 text-sm text-center px-1 py-1"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
          />
        </div>
      </div>

      {/* Figure order */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">図の順序</label>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5E7EB' }}
        >
          {figures.map((fig, i) => (
            <div
              key={fig.id}
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderBottom: i < figures.length - 1 ? '1px solid #F3F4F6' : 'none',
                background: 'white',
              }}
            >
              <span
                className="w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0"
                style={{ background: '#EEF2FF', color: '#6C63FF' }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-xs text-gray-700 truncate">
                {fig.params.title || `${TYPE_LABEL[fig.type] ?? fig.type} ${i + 1}`}
              </span>
              <div className="flex gap-0.5">
                <button
                  disabled={i === 0}
                  onClick={() => onReorder(i, i - 1)}
                  className="px-1.5 py-0.5 text-xs rounded transition-colors"
                  style={{
                    color: i === 0 ? '#D1D5DB' : '#6B7280',
                    cursor: i === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="上へ"
                >
                  ▲
                </button>
                <button
                  disabled={i === figures.length - 1}
                  onClick={() => onReorder(i, i + 1)}
                  className="px-1.5 py-0.5 text-xs rounded transition-colors"
                  style={{
                    color: i === figures.length - 1 ? '#D1D5DB' : '#6B7280',
                    cursor: i === figures.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="下へ"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export format */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">エクスポート形式</label>
        <div className="flex gap-1.5">
          {(['png', 'svg', 'pdf'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFormatChange(f)}
              style={btnStyle(format === f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={onExport}
        disabled={exporting || figures.length === 0}
        className="w-full py-2 text-sm font-semibold text-white transition-all"
        style={{
          background: exporting || figures.length === 0 ? '#D1D5DB' : '#6C63FF',
          borderRadius: 10,
          cursor: exporting || figures.length === 0 ? 'not-allowed' : 'pointer',
          boxShadow: exporting || figures.length === 0 ? 'none' : 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => {
          if (!exporting && figures.length > 0)
            (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0'
        }}
        onMouseLeave={(e) => {
          if (!exporting && figures.length > 0)
            (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF'
        }}
      >
        {exporting ? '生成中...' : `${format.toUpperCase()} をエクスポート`}
      </button>
    </div>
  )
}
