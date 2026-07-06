import { useState } from 'react'

interface Props {
  onParse: (data: number[][], labels: string[] | null) => void
}

type ParseResult = { data: number[][], labels: string[] | null }

function parseMatrix(text: string): ParseResult | null {
  const trimmed = text.trim()

  // numpy bracket notation: [[ 1.  0.8] [ 0.8  1. ]]
  const bracketRows = [...trimmed.matchAll(/\[\s*([-\d\s.e+]+?)\s*\]/g)]
  if (bracketRows.length >= 2) {
    const rows = bracketRows.map((m) => m[1].trim().split(/\s+/).map(Number))
    const n = rows[0]?.length
    if (n && rows.every((r) => r.length === n) && !rows.flat().some(isNaN)) {
      return { data: rows, labels: null }
    }
  }

  // CSV / TSV / space-separated (pandas df.corr() output)
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null

  const splitLine = (l: string): string[] => {
    if (l.includes('\t')) return l.split('\t').map((s) => s.trim())
    if (l.includes(',')) return l.split(',').map((s) => s.trim())
    return l.split(/\s+/)
  }

  const isNumeric = (s: string) => s !== '' && !isNaN(Number(s))
  const parsed = lines.map(splitLine)

  let headers: string[] | null = null
  let dataLines = parsed

  // First row has non-numeric values → it's a header row
  if (parsed[0].some((cell) => !isNumeric(cell))) {
    headers = parsed[0]
    dataLines = parsed.slice(1)
  }

  // Each data row may start with a non-numeric row label → strip it
  const data = dataLines.map((r) => {
    const start = r.findIndex(isNumeric)
    return start >= 0 ? r.slice(start).map(Number) : r.map(Number)
  })

  // Trim leading non-numeric cell from header (pandas index label)
  if (headers && !isNumeric(headers[0])) {
    headers = headers.slice(1)
  }

  const n = data[0]?.length
  if (!n) return null
  if (!data.every((r) => r.length === n)) return null
  if (data.flat().some(isNaN)) return null
  if (headers && headers.length !== n) headers = null

  return { data, labels: headers }
}

export default function CorrelationPaste({ onParse }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handle = () => {
    const result = parseMatrix(text)
    if (!result) {
      setError('解析できませんでした。numpy / pandas の出力を貼り付けてください。')
      return
    }
    setError(null)
    onParse(result.data, result.labels)
    setText('')
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        numpy・pandas の行列出力を貼り付け
        <br />
        <span className="text-[11px] text-gray-400">
          対応形式: numpy print出力・pandas df.corr()・CSV・TSV
        </span>
      </p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null) }}
        placeholder={'例:\n     A     B     C\nA  1.00  0.80  0.30\nB  0.80  1.00  0.50\nC  0.30  0.50  1.00'}
        rows={6}
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
