import { useState, useRef, useCallback, useEffect } from 'react'
import type { FigureType } from '../../types/figures'
import { useOcr, type OcrProvider } from '../../hooks/useOcr'
import { preprocessImageB64 } from '../../ocr/imagePreprocess'
import OcrConfirm from './OcrConfirm'
import PointDigitizer, { type DigitizerSeries } from './PointDigitizer'

interface Props {
  onApply: (type: FigureType, dataPatch: unknown, paramsPatch: Record<string, unknown>) => void
  onClose: () => void
}

type Step = 'upload' | 'digitize' | 'confirm'

const ALL_TYPES: FigureType[] = [
  'bar_chart', 'stacked_bar', 'combo_chart',
  'line_plot', 'scatter_plot', 'pie_chart',
  'histogram', 'box_plot', 'violin_plot', 'error_bar',
  'heatmap', 'confusion_matrix',
  'roc_curve', 'pr_curve', 'learning_curve', 'feature_importance',
]

const TYPE_JA: Record<FigureType, string> = {
  confusion_matrix:   '混合行列',
  heatmap:            'ヒートマップ',
  bar_chart:          '棒グラフ',
  line_plot:          '折れ線グラフ',
  scatter_plot:       '散布図',
  histogram:          'ヒストグラム',
  roc_curve:          'ROC曲線',
  pr_curve:           'PR曲線',
  learning_curve:     '学習曲線',
  feature_importance: '特徴量重要度',
  box_plot:           '箱ひげ図',
  violin_plot:        'バイオリンプロット',
  error_bar:          'エラーバー',
  stacked_bar:        '積み上げ棒グラフ',
  combo_chart:        '棒+折れ線複合',
  pie_chart:          '円グラフ',
}

const VISION_PROVIDERS: { value: Exclude<OcrProvider, 'tesseract'>; label: string; key: string; color: string }[] = [
  { value: 'claude',  label: 'Claude',  key: 'ocr_anthropic_key', color: '#D97706' },
  { value: 'openai',  label: 'GPT-4o',  key: 'ocr_openai_key',   color: '#059669' },
  { value: 'gemini',  label: 'Gemini',  key: 'ocr_google_key',   color: '#2563EB' },
]

// all types now use LLM OCR; PointDigitizer kept for Tesseract line/scatter
const DIGITIZE_TYPES: FigureType[] = []

// Tesseract-compatible types
const TESSERACT_GRID: FigureType[]     = ['confusion_matrix', 'heatmap']
const TESSERACT_DIGITIZE: FigureType[] = ['line_plot', 'scatter_plot']

export default function ImportModal({ onApply, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]           = useState<Step>('upload')
  const [imageUrl, setImageUrl]   = useState<string | null>(null)
  const [imageB64, setImageB64]   = useState<string | null>(null)
  const [figType, setFigType]     = useState<FigureType>('bar_chart')
  const [autoDetect, setAutoDetect] = useState(true)
  const [provider, setProvider]   = useState<OcrProvider>('claude')
  const [dragging, setDragging]   = useState(false)

  const { status, extracted, detectedType, error, run, reset } = useOcr()

  // Restore saved provider; fall back to first provider with a key, then Tesseract
  useEffect(() => {
    const saved = localStorage.getItem('ocr_provider') as OcrProvider | null
    const allProviders: OcrProvider[] = [...VISION_PROVIDERS.map(p => p.value), 'tesseract']
    if (saved && allProviders.includes(saved)) {
      setProvider(saved)
    } else {
      const first = VISION_PROVIDERS.find(p => Boolean(localStorage.getItem(p.key)?.trim()))
      setProvider(first?.value ?? 'tesseract')
    }
  }, [])

  // Persist provider selection
  useEffect(() => {
    localStorage.setItem('ocr_provider', provider)
  }, [provider])

  // Tesseract cannot auto-detect; disable autoDetect when tesseract is selected
  useEffect(() => {
    if (provider === 'tesseract') setAutoDetect(false)
  }, [provider])

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const url = e.target?.result as string
      setImageUrl(url)
      const rawB64 = url.split(',')[1] ?? ''
      try {
        const processedB64 = await preprocessImageB64(rawB64)
        setImageB64(processedB64)
      } catch {
        setImageB64(rawB64)
      }
      reset()
    }
    reader.readAsDataURL(file)
  }, [reset])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const DIGITIZE_TYPES_TESSERACT: FigureType[] = ['line_plot', 'scatter_plot']

  const handleAnalyze = async () => {
    if (!imageB64) return
    // Tesseract cannot extract coordinates from line/scatter — use PointDigitizer
    if (provider === 'tesseract' && DIGITIZE_TYPES_TESSERACT.includes(figType)) {
      setStep('digitize')
      return
    }
    await run(imageB64, autoDetect ? 'auto' : figType, provider)
  }

  const [manualExtracted, setManualExtracted] = useState<Record<string, unknown> | null>(null)

  // When OCR finishes, update figType from auto-detect then switch to confirm step
  useEffect(() => {
    if (status === 'done' && extracted) {
      if (detectedType) setFigType(detectedType)
      setManualExtracted(null)
      setStep('confirm')
    }
  }, [status, extracted, detectedType])

  const handleDigitizerComplete = (series: DigitizerSeries[]) => {
    const synth = { series: series.map(s => ({ name: s.name, x: s.x, y: s.y })) }
    setManualExtracted(synth)
    setStep('confirm')
  }

  const activeExtracted = extracted ?? manualExtracted ?? {}

  const handleApply = (type: FigureType, data: unknown, paramsPatch: Record<string, unknown>) => {
    onApply(type, data, paramsPatch)
    onClose()
  }

  const hasCurrentKey = provider !== 'tesseract' && Boolean(
    localStorage.getItem(VISION_PROVIDERS.find(p => p.value === provider)?.key ?? '') ?? ''
  )
  const hasAnyVisionKey = VISION_PROVIDERS.some(p => Boolean(localStorage.getItem(p.key)?.trim()))

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="bg-white rounded-2xl flex flex-col"
          style={{
            width: step === 'digitize' ? '92vw' : 640,
            height: step === 'digitize' ? '90vh' : 'auto',
            maxHeight: '90vh',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            padding: 24,
            overflow: 'hidden',
          }}
        >
          {/* ---- upload step ---- */}
          {step === 'upload' && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-800">図を読み込む (OCR)</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
              </div>

              {/* drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors"
                style={{
                  border: `2px dashed ${dragging ? '#6C63FF' : '#D1D5DB'}`,
                  background: dragging ? '#F0EFFE' : '#F9FAFB',
                  minHeight: imageUrl ? 160 : 200,
                  padding: 16,
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="preview"
                    style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
                  />
                ) : (
                  <>
                    <span style={{ fontSize: 36 }}>🖼️</span>
                    <p className="text-sm text-gray-500 mt-2">画像をドロップ、またはクリックして選択</p>
                    <p className="text-xs text-gray-400 mt-1">PNG / JPG / WebP</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />

              {/* figure type selector */}
              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold text-gray-600">図の種類</label>
                {/* auto-detect toggle (disabled for Tesseract) */}
                <button
                  onClick={() => { if (provider !== 'tesseract') setAutoDetect(true) }}
                  disabled={provider === 'tesseract'}
                  className="w-full text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors"
                  style={{
                    background: autoDetect ? '#6C63FF' : '#F3F4F6',
                    color: autoDetect ? 'white' : '#374151',
                    opacity: provider === 'tesseract' ? 0.4 : 1,
                    cursor: provider === 'tesseract' ? 'not-allowed' : 'pointer',
                  }}
                >
                  自動検出（推奨）{provider === 'tesseract' ? ' — Tesseract非対応' : ''}
                </button>
                {/* manual type grid */}
                <div
                  className="grid gap-1 transition-opacity"
                  style={{ gridTemplateColumns: 'repeat(4, 1fr)', opacity: autoDetect ? 0.4 : 1 }}
                >
                  {ALL_TYPES.map(t => {
                    const isTesseract = provider === 'tesseract'
                    const unsupported = isTesseract && !TESSERACT_GRID.includes(t) && !TESSERACT_DIGITIZE.includes(t)
                    const digitize    = isTesseract && TESSERACT_DIGITIZE.includes(t)
                    const active      = !autoDetect && figType === t
                    return (
                      <button
                        key={t}
                        onClick={() => { if (!unsupported) { setFigType(t); setAutoDetect(false) } }}
                        className="text-xs py-1.5 px-2 rounded-lg font-medium transition-colors relative"
                        style={{
                          background: active ? '#6C63FF' : '#F3F4F6',
                          color: active ? 'white' : unsupported ? '#C0C0C0' : '#374151',
                          border: active ? 'none' : '1px solid transparent',
                          opacity: unsupported ? 0.35 : 1,
                          cursor: unsupported ? 'not-allowed' : 'pointer',
                        }}
                        title={unsupported ? 'Tesseract非対応' : digitize ? '手動点取り (PointDigitizer)' : undefined}
                      >
                        {TYPE_JA[t]}
                        {digitize && !active && (
                          <span style={{ fontSize: 8, position: 'absolute', top: 2, right: 3, color: '#6B7280' }}>✏️</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* provider selector (only for non-digitize types) */}
              {!DIGITIZE_TYPES.includes(figType) && (
                <div className="mt-3 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">解析方法</label>
                  <div className="flex gap-2 flex-wrap">
                    {VISION_PROVIDERS.map(p => {
                      const keySet = Boolean(localStorage.getItem(p.key)?.trim())
                      const active = provider === p.value
                      return (
                        <button
                          key={p.value}
                          onClick={() => setProvider(p.value)}
                          className="text-sm py-2 px-4 rounded-xl font-semibold transition-all flex items-center gap-1.5"
                          style={{
                            background: active ? p.color : `${p.color}18`,
                            color: active ? 'white' : p.color,
                            border: `1.5px solid ${p.color}`,
                          }}
                        >
                          {p.label}
                          {keySet && (
                            <span style={{ fontSize: 10, opacity: active ? 0.9 : 0.7 }}>✓</span>
                          )}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setProvider('tesseract')}
                      className="text-sm py-2 px-4 rounded-xl font-semibold transition-all"
                      style={{
                        background: provider === 'tesseract' ? '#374151' : '#F3F4F6',
                        color: provider === 'tesseract' ? 'white' : '#6B7280',
                        border: '1.5px solid ' + (provider === 'tesseract' ? '#374151' : '#E5E7EB'),
                      }}
                    >
                      Tesseract <span style={{ fontSize: 10, opacity: 0.75 }}>(ローカル)</span>
                    </button>
                  </div>

                  {provider === 'tesseract' && (
                    <p className="text-xs text-amber-700 mt-1 px-2 py-1.5 rounded-lg" style={{ background: '#FFFBEB' }}>
                      {hasAnyVisionKey
                        ? 'ブラウザ内OCRを使用。混合行列・ヒートマップ以外は手動修正が必要です。'
                        : 'Vision APIキー未設定のためTesseract.js（ブラウザ内）を使用します。精度はVision APIより低くなります。'}
                    </p>
                  )}
                  {provider !== 'tesseract' && !hasCurrentKey && (
                    <p className="text-xs text-red-500 mt-1">
                      このプロバイダのAPIキーが未設定です。⚙️ から設定してください。
                    </p>
                  )}
                </div>
              )}


              {error && (
                <p className="text-xs text-red-500 mt-2 p-2 rounded-lg" style={{ background: '#FEF2F2' }}>
                  {error}
                </p>
              )}

              {/* footer */}
              <div className="flex gap-2 justify-end mt-5">
                <button
                  onClick={onClose}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!imageUrl || status === 'processing'}
                  className="text-xs px-5 py-1.5 rounded-lg text-white font-semibold"
                  style={{
                    background: (!imageUrl || status === 'processing') ? '#A78BFA' : '#6C63FF',
                    cursor: (!imageUrl || status === 'processing') ? 'not-allowed' : 'pointer',
                  }}
                >
                  {status === 'processing' ? '解析中...' : '解析開始'}
                </button>
              </div>
            </>
          )}

          {/* ---- digitize step ---- */}
          {step === 'digitize' && imageUrl && (
            <PointDigitizer
              imageUrl={imageUrl}
              onComplete={handleDigitizerComplete}
              onCancel={() => setStep('upload')}
            />
          )}

          {/* ---- confirm step ---- */}
          {step === 'confirm' && imageUrl && (
            <OcrConfirm
              type={figType}
              extracted={activeExtracted as Record<string, unknown>}
              imageUrl={imageUrl}
              onApply={handleApply}
              onBack={() => { setStep('upload'); reset() }}
              onClose={onClose}
            />
          )}
        </div>
      </div>

    </>
  )
}
