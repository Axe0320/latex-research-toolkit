import { useState } from 'react'
import type { HeatmapState, HeatmapParams } from '../../types/figures'
import TextEditor from './TextEditor'
import SizeEditor from './SizeEditor'
import HeatmapDisplayEditor from './HeatmapDisplayEditor'
import HeatmapLabelEditor from './HeatmapLabelEditor'

interface Props {
  figure: HeatmapState
  onChange: (patch: Partial<HeatmapParams>) => void
  onReset: () => void
}

type Section = 'text' | 'display' | 'label' | 'size'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',    label: 'テキスト' },
  { key: 'display', label: '表示' },
  { key: 'label',   label: 'ラベル' },
  { key: 'size',    label: 'サイズ' },
]

export default function HeatmapEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')

  const toggle = (s: Section) => setOpen((prev) => (prev === s ? 'text' : s))

  return (
    <div className="space-y-1">
      <div className="flex justify-end mb-2">
        <button
          onClick={onReset}
          className="text-xs font-semibold px-3 py-1.5 transition-all"
          style={{
            color: '#D97706',
            border: '1px solid #FDE68A',
            borderRadius: 6,
            background: '#FFFBEB',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEF3C7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFBEB'
          }}
        >
          リセット
        </button>
      </div>

      {SECTIONS.map(({ key, label }) => (
        <div
          key={key}
          className="overflow-hidden"
          style={{
            border: open === key ? '1px solid #C4B5FD' : '1px solid #E5E7EB',
            borderRadius: 10,
            transition: 'border-color 0.15s',
          }}
        >
          <button
            onClick={() => toggle(key)}
            className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium transition-colors"
            style={{
              color: open === key ? '#6C63FF' : '#374151',
              background: open === key ? '#F5F3FF' : 'white',
            }}
          >
            {label}
            <span style={{ color: open === key ? '#6C63FF' : '#9CA3AF' }}>
              {open === key ? '▲' : '▼'}
            </span>
          </button>
          {open === key && (
            <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid #EDE9FE' }}>
              {key === 'text' && (
                <TextEditor
                  params={figure.params}
                  onChange={(p) => onChange(p as Partial<HeatmapParams>)}
                />
              )}
              {key === 'display' && (
                <HeatmapDisplayEditor params={figure.params} onChange={onChange} />
              )}
              {key === 'label' && (
                <HeatmapLabelEditor
                  params={figure.params}
                  dataRows={figure.data.length}
                  dataCols={figure.data[0]?.length ?? 0}
                  onChange={onChange}
                />
              )}
              {key === 'size' && (
                <SizeEditor
                  params={figure.params}
                  onChange={(p) => onChange(p as Partial<HeatmapParams>)}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
