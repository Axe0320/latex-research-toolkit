export const PALETTES: { label: string; colors: string[] }[] = [
  { label: 'デフォルト', colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF', '#F97316', '#14B8A6'] },
  { label: '学術',       colors: ['#6BAE9E', '#E8956D', '#7B91C2', '#C9B45C', '#A87DC0', '#E07C8A', '#5B8C5A', '#C17B3F'] },
  { label: 'パステル',   colors: ['#AED6F1', '#A9DFBF', '#FAD7A0', '#F1948A', '#D7BDE2', '#FDEBD0', '#FCE4EC', '#E8F5E9'] },
  { label: 'ビビッド',   colors: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#2980B9'] },
  { label: 'グレー',     colors: ['#111827', '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#F9FAFB'] },
  { label: '赤系',       colors: ['#991B1B', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FFF5F5'] },
  { label: '青系',       colors: ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF'] },
  { label: '緑系',       colors: ['#065F46', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#F0FDF4'] },
]

interface PaletteButtonsProps {
  currentColors?: string[]
  onChange: (colors: string[]) => void
}

export function PaletteButtons({ currentColors, onChange }: PaletteButtonsProps) {
  const activeLabel = PALETTES.find(p =>
    currentColors && p.colors.every((c, i) => c === (currentColors[i] ?? ''))
  )?.label ?? null

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">カラーパレット</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {PALETTES.map(({ label, colors }) => {
          const isActive = label === activeLabel
          const accent = colors[2]
          return (
            <button
              key={label}
              onClick={() => onChange(colors)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '5px 4px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                border: isActive ? `1.5px solid ${accent}` : '1px solid #E5E7EB',
                background: isActive ? `${accent}22` : 'white',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = `${accent}11`; e.currentTarget.style.borderColor = `${accent}88` } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB' } }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                {colors.slice(0, 6).map((c, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />
                ))}
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? accent : '#6B7280', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
