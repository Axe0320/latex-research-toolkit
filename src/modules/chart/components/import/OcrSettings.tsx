import { useState, useEffect } from 'react'
import type { OcrProvider } from '../../hooks/useOcr'

interface Props {
  onClose: () => void
}

const PROVIDERS: { key: string; provider: OcrProvider; label: string; desc: string; placeholder: string; color: string }[] = [
  { key: 'ocr_anthropic_key', provider: 'claude',  label: 'Anthropic',  desc: 'Claude Vision',          placeholder: 'sk-ant-api03-...', color: '#D97706' },
  { key: 'ocr_openai_key',    provider: 'openai',  label: 'OpenAI',     desc: 'GPT-4o Vision',          placeholder: 'sk-proj-...',      color: '#059669' },
  { key: 'ocr_google_key',    provider: 'gemini',  label: 'Google',     desc: 'Gemini 3.1 Flash Lite',  placeholder: 'AIzaSy...',        color: '#2563EB' },
]

export default function OcrSettings({ onClose }: Props) {
  const [keys, setKeys]   = useState<Record<string, string>>({})
  const [show, setShow]   = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loaded: Record<string, string> = {}
    PROVIDERS.forEach(p => { loaded[p.key] = localStorage.getItem(p.key) ?? '' })
    setKeys(loaded)
  }, [])

  const handleSave = () => {
    PROVIDERS.forEach(p => {
      if (keys[p.key]?.trim()) localStorage.setItem(p.key, keys[p.key].trim())
      else localStorage.removeItem(p.key)
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  const isSet = (key: string) => Boolean(keys[key]?.trim())

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 70 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{ width: 520, boxShadow: '0 12px 48px rgba(0,0,0,0.22)', padding: 32 }}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Vision API キー設定</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          キーはブラウザの <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">localStorage</code> にのみ保存されます。サーバーには一切送信されません。
        </p>

        {/* provider rows */}
        <div className="space-y-5">
          {PROVIDERS.map(p => (
            <div key={p.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${p.color}18`, color: p.color }}
                >
                  {p.label}
                </span>
                <span className="text-sm font-semibold text-gray-700">{p.desc}</span>
                {isSet(p.key) && (
                  <span className="text-xs text-emerald-600 font-semibold ml-auto">✓ 設定済み</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type={show[p.key] ? 'text' : 'password'}
                  value={keys[p.key] ?? ''}
                  onChange={e => setKeys(prev => ({ ...prev, [p.key]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="flex-1 font-mono text-sm px-3 py-2 rounded-xl"
                  style={{ border: '1.5px solid #E5E7EB', outline: 'none', letterSpacing: show[p.key] ? 0 : 2 }}
                />
                <button
                  onClick={() => setShow(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className="text-sm px-3 py-2 rounded-xl font-medium"
                  style={{ border: '1.5px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB', minWidth: 56 }}
                >
                  {show[p.key] ? '隠す' : '表示'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="text-sm px-5 py-2 rounded-xl font-medium"
            style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-8 py-2 rounded-xl text-white font-bold"
            style={{ background: saved ? '#10B981' : '#6C63FF', minWidth: 100 }}
          >
            {saved ? '保存しました ✓' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
