import { useState } from 'react'
import type { ConfusionMatrixState, ConfusionMatrixParams } from '../../types/figures'
import TextEditor from './TextEditor'
import ColorEditor from './ColorEditor'
import LabelEditor from './LabelEditor'
import SizeEditor from './SizeEditor'

interface Props {
  figure: ConfusionMatrixState
  onChange: (patch: Partial<ConfusionMatrixParams>) => void
  onReset: () => void
}

type Section = 'text' | 'color' | 'label' | 'size'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',  label: 'テキスト' },
  { key: 'color', label: 'カラー' },
  { key: 'label', label: 'ラベル' },
  { key: 'size',  label: 'サイズ' },
]

export default function FigureEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')

  const toggle = (s: Section) => setOpen((prev) => prev === s ? 'text' : s)

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
            <div
              className="px-3 pb-3 pt-1"
              style={{ borderTop: '1px solid #EDE9FE' }}
            >
              {key === 'text'  && (
                <TextEditor
                  params={figure.params}
                  onChange={(p) => onChange(p as Partial<ConfusionMatrixParams>)}
                />
              )}
              {key === 'color' && (
                <ColorEditor
                  colormap={figure.params.colormap}
                  onChange={(colormap) => onChange({ colormap })}
                />
              )}
              {key === 'label' && (
                <LabelEditor
                  params={figure.params}
                  matrixSize={figure.data.length}
                  onChange={onChange}
                />
              )}
              {key === 'size'  && (
                <SizeEditor
                  params={figure.params}
                  onChange={(p) => onChange(p as Partial<ConfusionMatrixParams>)}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
