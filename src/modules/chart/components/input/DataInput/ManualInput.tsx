interface Props {
  data: number[][]
  onChange: (data: number[][]) => void
}

const SIZES = [2, 3, 4, 5, 6]

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function ManualInput({ data, onChange }: Props) {
  const n = data.length || 2

  const resize = (newN: number) => {
    const next = Array.from({ length: newN }, (_, i) =>
      Array.from({ length: newN }, (_, j) => data[i]?.[j] ?? 0)
    )
    onChange(next)
  }

  const setValue = (i: number, j: number, val: string) => {
    const num = val === '' ? 0 : Number(val)
    if (isNaN(num)) return
    const next = data.map((row) => [...row])
    next[i][j] = num
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">行列サイズ</span>
        <select
          value={n}
          onChange={(e) => resize(Number(e.target.value))}
          className="text-xs px-2 py-1"
          style={{ border: '1px solid #E5E7EB', borderRadius: 8 }}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s} × {s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((val, j) => (
                  <td key={j} className="p-0.5">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => setValue(i, j, e.target.value)}
                      className="w-14 text-center text-sm px-1 py-1"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
