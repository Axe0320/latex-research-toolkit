import { useEffect, useState } from 'react'
import {
  generateFigureLatex, DEFAULT_FIGURE_LATEX_OPTIONS,
  type FigureLatexOptions, type FigureEnvironment, type FigurePlacement, type FigureWidthUnit, type FigureWrapStyle,
} from '../../../../shared/latexFigure'

interface Props {
  filename: string
  defaultCaption: string
  defaultLabel: string
}

const SELECT_CLASS = 'text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700'

export default function LatexFigureExport({ filename, defaultCaption, defaultLabel }: Props) {
  const [useTitleAsCaption, setUseTitleAsCaption] = useState(true)
  const [caption, setCaption] = useState(defaultCaption)
  const [label, setLabel] = useState(defaultLabel)
  const [opts, setOpts] = useState<FigureLatexOptions>(DEFAULT_FIGURE_LATEX_OPTIONS)
  const [copied, setCopied] = useState(false)

  // Keeps the caption in sync with the figure's own title (e.g. when
  // switching figures, or editing the title elsewhere) as long as the user
  // hasn't opted to start from a blank caption instead.
  useEffect(() => {
    if (useTitleAsCaption) setCaption(defaultCaption)
  }, [defaultCaption, useTitleAsCaption])
  useEffect(() => setLabel(defaultLabel), [defaultLabel])

  const handleToggleUseTitle = (checked: boolean) => {
    setUseTitleAsCaption(checked)
    if (!checked) setCaption('')
  }

  const code = generateFigureLatex(filename, caption, label, opts)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-4 pt-4" data-testid="latex-figure-export" style={{ borderTop: '1px solid #E5E7EB' }}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">LaTeX 図表コード</p>

      <label className="flex items-center gap-1.5 mb-1.5 text-[11px] text-gray-500 select-none">
        <input
          type="checkbox"
          checked={useTitleAsCaption}
          onChange={(e) => handleToggleUseTitle(e.target.checked)}
        />
        図のタイトルをCaptionに使う
      </label>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (例: fig:result)"
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <select className={SELECT_CLASS} value={opts.environment}
          onChange={(e) => setOpts((o) => ({ ...o, environment: e.target.value as FigureEnvironment }))}>
          <option value="figure*">figure*（2段組）</option>
          <option value="figure">figure（1段組）</option>
        </select>
        <select className={SELECT_CLASS} value={opts.placement}
          onChange={(e) => setOpts((o) => ({ ...o, placement: e.target.value as FigurePlacement }))}>
          {(['tb', 'htbp', 'h', 't', 'b', 'p'] as FigurePlacement[]).map((p) => (
            <option key={p} value={p}>[{p}]</option>
          ))}
        </select>
        <select className={SELECT_CLASS} value={opts.widthFraction}
          onChange={(e) => setOpts((o) => ({ ...o, widthFraction: Number(e.target.value) }))}>
          {[1.0, 0.8, 0.6, 0.5, 0.4].map((f) => (
            <option key={f} value={f}>{Math.round(f * 100)}%</option>
          ))}
        </select>
        <select className={SELECT_CLASS} value={opts.widthUnit}
          onChange={(e) => setOpts((o) => ({ ...o, widthUnit: e.target.value as FigureWidthUnit }))}>
          <option value="linewidth">\linewidth</option>
          <option value="textwidth">\textwidth</option>
          <option value="columnwidth">\columnwidth</option>
        </select>
        <select className={SELECT_CLASS} value={opts.wrapStyle}
          onChange={(e) => setOpts((o) => ({ ...o, wrapStyle: e.target.value as FigureWrapStyle }))}>
          <option value="center-env">center環境</option>
          <option value="centering">\centering</option>
        </select>
      </div>

      <textarea
        readOnly
        value={code}
        rows={6}
        className="w-full font-mono text-xs p-2 rounded-lg border border-gray-200 bg-gray-50"
        style={{ resize: 'none' }}
      />
      <button
        onClick={handleCopy}
        className="mt-1.5 w-full py-1.5 text-xs font-semibold rounded-lg"
        style={{ background: copied ? '#10B981' : '#F0EFFE', color: copied ? 'white' : '#6C63FF' }}
      >
        {copied ? 'コピーしました ✓' : 'LaTeXコードをコピー'}
      </button>
    </div>
  )
}
