import { useRef } from 'react'

interface Props {
  onParse: (rows: string[][]) => void
  label?: string
}

export default function CsvUploadButton({ onParse, label = 'CSV読み込み' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      const rows = text.trim().split(/\r?\n/).map((row) =>
        row.split(',').map((cell) => cell.trim())
      )
      if (rows.length > 0) onParse(rows)
    }
    reader.readAsText(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="text-xs px-3 py-1 rounded-lg transition-all"
        style={{ border: '1px solid #C4B5FD', color: '#6C63FF', background: 'white' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
      >
        {label}
      </button>
    </>
  )
}
