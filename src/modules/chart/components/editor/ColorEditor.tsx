interface Props {
  colormap: string
  onChange: (colormap: string) => void
}

const COLORMAPS = [
  { value: 'Blues',    label: 'Blues' },
  { value: 'Reds',     label: 'Reds' },
  { value: 'Greens',   label: 'Greens' },
  { value: 'Oranges',  label: 'Oranges' },
  { value: 'Purples',  label: 'Purples' },
  { value: 'coolwarm', label: 'coolwarm' },
  { value: 'RdBu',     label: 'RdBu' },
  { value: 'YlOrRd',   label: 'YlOrRd' },
  { value: 'viridis',  label: 'viridis' },
  { value: 'plasma',   label: 'plasma' },
  { value: 'gray',     label: 'gray' },
]

export default function ColorEditor({ colormap, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">カラーマップ</label>
      <select
        value={colormap}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3 py-1.5"
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
      >
        {COLORMAPS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>
  )
}
