import { useRef } from 'react'
import { PALETTES } from './colorPalettes'

interface Props {
  value: string
  onChange: (color: string) => void
  paletteColors?: string[]
}

const NEUTRAL_PRESETS = ['#FFFFFF', '#000000', '#DC2626']

const DEFAULT_PALETTE = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF', '#F97316', '#14B8A6']

export default function HexColorEditor({ value, onChange, paletteColors }: Props) {
  const lastPaletteRef = useRef<string[]>(DEFAULT_PALETTE)

  // パレットと完全一致したときだけ ref を更新（個別色の変更では更新しない）
  const matched = paletteColors
    ? PALETTES.find(p => p.colors.every((c, i) => c === (paletteColors[i] ?? '')))
    : null
  if (matched) lastPaletteRef.current = matched.colors

  const presets = [...lastPaletteRef.current, ...NEUTRAL_PRESETS]

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {presets.map((c, idx) => (
          <button
            key={idx}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 20, height: 20, borderRadius: 4, background: c,
              border: c.toLowerCase() === value.toLowerCase()
                ? '2px solid #6C63FF' : '1px solid #D1D5DB',
              cursor: 'pointer', flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="shrink-0 cursor-pointer"
          style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6, padding: 2 }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="flex-1 text-xs px-2 py-1 font-mono"
          style={{ border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', transition: 'border-color 0.15s' }}
          maxLength={7}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
        />
      </div>
    </div>
  )
}
