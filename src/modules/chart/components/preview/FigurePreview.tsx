import type { OutputFormat } from '../../types/figures'

interface Props {
  b64: string | null
  loading: boolean
  error: string | null
  format: OutputFormat
  downloadLoading?: boolean
  onFormatChange: (f: OutputFormat) => void
  onDownload: () => void
}

const FORMATS: { val: OutputFormat; label: string }[] = [
  { val: 'png', label: 'PNG' },
  { val: 'svg', label: 'SVG' },
  { val: 'pdf', label: 'PDF' },
  { val: 'eps', label: 'EPS' },
]

export default function FigurePreview({ b64, loading, error, format, downloadLoading, onFormatChange, onDownload }: Props) {
  const disabled = !b64 || loading || downloadLoading

  return (
    <div className="flex flex-col">
      <div
        className="bg-white min-h-64 relative"
        style={{ border: '1px solid #E5E7EB', borderRadius: 14, boxShadow: 'var(--shadow-md)' }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#6C63FF' }} />
            <span className="text-sm">生成中...</span>
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500 text-sm px-4 text-center">{error}</p>
          </div>
        )}
        {!loading && !error && b64 && (
          <img
            src={`data:image/png;base64,${b64}`}
            alt="Generated figure"
            className="block p-4"
            style={{ maxWidth: '100%', height: 'auto', width: 'auto', margin: '0 auto' }}
          />
        )}
        {!loading && !error && !b64 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-300 text-sm">データを入力するとプレビューが表示されます</p>
          </div>
        )}
      </div>

      {/* 出力形式選択 */}
      <div className="mt-3 flex gap-1">
        {FORMATS.map(({ val, label }) => (
          <button
            key={val}
            onClick={() => onFormatChange(val)}
            className="flex-1 py-1 text-xs font-semibold rounded-lg transition-all"
            style={{
              border: format === val ? '1.5px solid #6C63FF' : '1px solid #E5E7EB',
              background: format === val ? '#EEF2FF' : 'white',
              color: format === val ? '#6C63FF' : '#9CA3AF',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onDownload}
        disabled={disabled}
        className="mt-2 w-full py-2 px-4 text-white text-sm font-semibold transition-all"
        style={{
          background: disabled ? '#D1D5DB' : '#6C63FF',
          borderRadius: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0' }}
        onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF' }}
      >
        {downloadLoading ? '変換中...' : `${format.toUpperCase()} をダウンロード`}
      </button>
    </div>
  )
}
