import { useState } from 'react'

interface Props {
  onParse: (data: number[][]) => void
}

function parseMatrix(text: string): number[][] | null {
  try {
    const rowMatches = [...text.matchAll(/\[\s*([\d\s.]+?)\s*\]/g)]
    if (!rowMatches.length) return null
    const rows = rowMatches.map((m) => m[1].trim().split(/\s+/).map(Number))
    const n = rows[0].length
    if (rows.length !== n || rows.some((r) => r.length !== n)) return null
    if (rows.flat().some(isNaN)) return null
    return rows
  } catch {
    return null
  }
}

export default function SklearnPaste({ onParse }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handle = () => {
    const matrix = parseMatrix(text)
    if (!matrix) {
      setError('解析できませんでした。sklearn の confusion_matrix() の出力を貼り付けてください。')
      return
    }
    setError(null)
    onParse(matrix)
    setText('')
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">
          print(confusion_matrix(y_true, y_pred))
        </code>{' '}
        の出力を貼り付け
      </p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null) }}
        placeholder={'[[45  3]\n [ 2 50]]'}
        rows={4}
        className="w-full text-sm font-mono px-3 py-2 resize-none"
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handle}
        disabled={!text.trim()}
        className="w-full py-1.5 text-sm font-semibold text-white transition-all"
        style={{
          background: text.trim() ? '#6C63FF' : '#D1D5DB',
          borderRadius: 8,
          cursor: text.trim() ? 'pointer' : 'not-allowed',
        }}
        onMouseEnter={(e) => {
          if (text.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0'
        }}
        onMouseLeave={(e) => {
          if (text.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF'
        }}
      >
        読み込む
      </button>
    </div>
  )
}
