import { useState, useRef, useEffect } from 'react'
import type { FigureState, FigureType } from '../../types/figures'

interface Props {
  figures: FigureState[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onAdd: (type: FigureType) => void
  onDuplicate: (id: string) => void
}

const TYPE_LABEL: Record<FigureType, string> = {
  confusion_matrix:   'CM',
  heatmap:            'HM',
  bar_chart:          'Bar',
  line_plot:          'Line',
  scatter_plot:       'Scat',
  histogram:          'Hist',
  roc_curve:          'ROC',
  pr_curve:           'PR',
  learning_curve:     'Lrn',
  feature_importance: 'Feat',
  box_plot:           'Box',
  violin_plot:        'Vln',
  error_bar:          'Err',
  stacked_bar:        'Stk',
  combo_chart:        'Cmb',
  pie_chart:          'Pie',
}
const TYPE_FULL: Record<FigureType, string> = {
  confusion_matrix:   '混合行列',
  heatmap:            'ヒートマップ',
  bar_chart:          '棒グラフ',
  line_plot:          '折れ線',
  scatter_plot:       '散布図',
  histogram:          'ヒストグラム',
  roc_curve:          'ROC曲線',
  pr_curve:           'PR曲線',
  learning_curve:     '学習曲線',
  feature_importance: '特徴量重要度',
  box_plot:           '箱ひげ図',
  violin_plot:        'バイオリンプロット',
  error_bar:          'エラーバー',
  stacked_bar:        '積み上げ棒',
  combo_chart:        '棒+折れ線',
  pie_chart:          '円グラフ',
}

const ALL_TYPES: FigureType[] = [
  'bar_chart', 'stacked_bar', 'combo_chart',
  'line_plot', 'scatter_plot', 'pie_chart',
  'histogram', 'box_plot', 'violin_plot', 'error_bar',
  'heatmap', 'confusion_matrix',
  'roc_curve', 'pr_curve', 'learning_curve', 'feature_importance',
]

export default function FigureList({ figures, selectedId, onSelect, onDelete, onAdd, onDuplicate }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex items-center flex-1 min-w-0 gap-2 px-3">
      {/* チップのみ overflow-x-auto */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
        {figures.map((fig, i) => {
          const selected = fig.id === selectedId
          const hovered = fig.id === hoverId
          return (
            <button
              key={fig.id}
              onClick={() => onSelect(fig.id)}
              onMouseEnter={() => setHoverId(fig.id)}
              onMouseLeave={() => setHoverId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm shrink-0 transition-all font-medium"
              style={{
                background: selected ? '#EEF2FF' : '#F9FAFB',
                border: selected ? '1px solid #C4B5FD' : '1px solid #E5E7EB',
                color: selected ? '#6C63FF' : '#374151',
              }}
              title={TYPE_FULL[fig.type]}
            >
              <span className="font-bold">{i + 1}</span>
              <span>{TYPE_LABEL[fig.type]}</span>

              {/* 複製ボタン：ホバー時に表示 */}
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDuplicate(fig.id) }}
                title="複製"
                className="ml-0.5 leading-none text-xs transition-opacity"
                style={{
                  opacity: hovered ? 1 : 0,
                  color: selected ? '#A78BFA' : '#9CA3AF',
                  fontSize: 13,
                }}
              >
                ⎘
              </span>

              {figures.length > 1 && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(fig.id) }}
                  className="leading-none text-base transition-opacity"
                  style={{
                    opacity: hovered ? 1 : 0.4,
                    color: '#EF4444',
                  }}
                >
                  ×
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ＋ボタンは overflow-x-auto の外 → ポップアップがクリップされない */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
          style={{
            border: '1px dashed #C4B5FD',
            color: '#6C63FF',
            background: showMenu ? '#EEF2FF' : 'white',
          }}
          title="図を追加"
        >
          ＋
        </button>
        {showMenu && (
          <div
            className="absolute top-full right-0 mt-1 bg-white rounded-lg z-50 py-1"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,.12)', border: '1px solid #E5E7EB', minWidth: 140 }}
          >
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { onAdd(t); setShowMenu(false) }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {TYPE_FULL[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
