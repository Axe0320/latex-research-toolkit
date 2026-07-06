import { useState, useCallback } from 'react'
import type { FigureType } from '../../types/figures'

interface Props {
  type: FigureType
  extracted: Record<string, unknown>
  imageUrl: string
  onApply: (type: FigureType, dataPatch: unknown, paramsPatch: Record<string, unknown>) => void
  onBack: () => void
  onClose: () => void
}

// Convert extracted OCR JSON to FigureState.data + params patch
function toDataAndParams(type: FigureType, extracted: Record<string, unknown>): {
  data: unknown
  paramsPatch: Record<string, unknown>
} {
  const e = extracted as Record<string, unknown>
  switch (type) {
    case 'confusion_matrix':
      return {
        data: e.matrix ?? [],
        paramsPatch: { labels: e.labels ?? [] },
      }
    case 'heatmap':
      return {
        data: e.matrix ?? [],
        paramsPatch: {
          labels_x: e.labels_x ?? [],
          labels_y: e.labels_y ?? [],
        },
      }
    case 'bar_chart': {
      const vals = e.values as number[][] | undefined
      const names = e.series_names as string[] | undefined
      return {
        data: { labels: e.labels ?? [], values: vals?.[0] ?? [] },
        paramsPatch: { legend: names ?? [] },
      }
    }
    case 'line_plot': {
      const series = (e.series as { name: string; x: number[]; y: number[] }[] | undefined) ?? []
      const xs = series.map(s => s.x)
      const ys = series.map(s => s.y)
      return {
        data: {
          x: xs[0] ?? [],
          y: ys.length === 1 ? ys[0] : ys,
        },
        paramsPatch: { legend: series.map(s => s.name) },
      }
    }
    case 'scatter_plot': {
      const series = (e.series as { name: string; x: number[]; y: number[] }[] | undefined) ?? []
      return {
        data: { series: series.map(s => ({ x: s.x, y: s.y })) },
        paramsPatch: { legend: series.map(s => s.name) },
      }
    }
    case 'histogram':
      return { data: (e.values as number[]) ?? [], paramsPatch: {} }
    case 'roc_curve': {
      const series = (e.series as { name: string; fpr: number[]; tpr: number[]; auc: number }[] | undefined) ?? []
      return {
        data: {
          fpr: series.map(s => s.fpr),
          tpr: series.map(s => s.tpr),
          auc: series.map(s => s.auc),
        },
        paramsPatch: { legend: series.map(s => s.name) },
      }
    }
    case 'pr_curve': {
      const series = (e.series as { name: string; precision: number[]; recall: number[]; ap: number }[] | undefined) ?? []
      return {
        data: {
          precision: series.map(s => s.precision),
          recall: series.map(s => s.recall),
          ap: series.map(s => s.ap),
        },
        paramsPatch: { legend: series.map(s => s.name) },
      }
    }
    case 'learning_curve':
      return {
        data: {
          epochs: (e.epochs as number[]) ?? [],
          series: (e.series as { label: string; axis: string; values: number[] }[] | undefined) ?? [],
        },
        paramsPatch: {},
      }
    case 'feature_importance':
      return {
        data: { features: e.features ?? [], importances: e.importances ?? [] },
        paramsPatch: {},
      }
    case 'box_plot':
      return {
        data: { groups: e.groups ?? [] },
        paramsPatch: { labels: e.labels ?? [] },
      }
    case 'violin_plot':
      return {
        data: { groups: e.groups ?? [] },
        paramsPatch: { labels: e.labels ?? [] },
      }
    case 'error_bar':
      return {
        data: { labels: e.labels ?? [], series: e.series ?? [] },
        paramsPatch: {},
      }
    case 'stacked_bar':
      return {
        data: { labels: e.labels ?? [], values: e.values ?? [[]] },
        paramsPatch: {},
      }
    case 'combo_chart':
      return {
        data: {
          labels: e.labels ?? [],
          bar_series: e.bar_series ?? [],
          line_series: e.line_series ?? [],
        },
        paramsPatch: {},
      }
    case 'pie_chart':
      return {
        data: { labels: e.labels ?? [], values: e.values ?? [] },
        paramsPatch: {},
      }
    default:
      return { data: null, paramsPatch: {} }
  }
}

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

export default function OcrConfirm({ type, extracted, imageUrl, onApply, onBack, onClose }: Props) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(extracted, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>
      setParseError(null)
      const { data, paramsPatch } = toDataAndParams(type, parsed)
      onApply(type, data, paramsPatch)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'JSON parse error')
    }
  }, [jsonText, type, onApply])

  return (
    <div className="flex flex-col h-full gap-3" style={{ minHeight: 0 }}>
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
          >
            ← 戻る
          </button>
          <span className="text-sm font-bold text-gray-800">
            抽出結果の確認 — {TYPE_JA[type] ?? type}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      {/* body */}
      <div className="flex gap-3 flex-1" style={{ minHeight: 0 }}>
        {/* image preview */}
        <div
          className="flex-none rounded-xl overflow-hidden"
          style={{ width: 220, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={imageUrl}
            alt="uploaded"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* JSON editor */}
        <div className="flex-1 flex flex-col gap-2" style={{ minHeight: 0 }}>
          <p className="text-xs text-gray-500">
            JSONを直接編集してデータを修正できます。
          </p>
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setParseError(null) }}
            className="flex-1 text-xs font-mono p-2 rounded-xl resize-none"
            style={{
              border: parseError ? '1px solid #EF4444' : '1px solid #E5E7EB',
              outline: 'none',
              minHeight: 200,
            }}
            spellCheck={false}
          />
          {parseError && (
            <p className="text-xs text-red-500">{parseError}</p>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="flex gap-2 justify-end pt-1" style={{ borderTop: '1px solid #F3F4F6' }}>
        <button
          onClick={onBack}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}
        >
          キャンセル
        </button>
        <button
          onClick={handleApply}
          className="text-xs px-5 py-1.5 rounded-lg text-white font-semibold"
          style={{ background: '#6C63FF' }}
        >
          この内容で新規図に適用
        </button>
      </div>
    </div>
  )
}
