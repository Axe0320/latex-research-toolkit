import { useState, type CSSProperties } from 'react'
import {
  generateFigureLatex, DEFAULT_FIGURE_LATEX_OPTIONS,
  type FigureLatexOptions, type FigureEnvironment, type FigurePlacement, type FigureWidthUnit, type FigureWrapStyle,
} from '../../../shared/latexFigure'
import type { FigureFileItem } from '../types/conversion'

interface Props {
  doneItems: FigureFileItem[]
}

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const baseName = (filename: string): string => filename.replace(/\.[^.]+$/, '')

const selectStyle: CSSProperties = {
  fontSize: '.8rem',
  fontWeight: 500,
  color: 'var(--text)',
  background: 'var(--card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--rx)',
  padding: '.3rem .6rem',
  cursor: 'pointer',
}

const inputStyle: CSSProperties = {
  flex: 1,
  fontSize: '.8rem',
  color: 'var(--text)',
  background: '#FAFAFA',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--rs)',
  padding: '.4rem .6rem',
  outline: 'none',
}

export function LatexCodeSection({ doneItems }: Props) {
  const [opts, setOpts] = useState<FigureLatexOptions>(DEFAULT_FIGURE_LATEX_OPTIONS)

  return (
    <div>
      <div className="section-header">
        <span className="section-label">
          <span className="section-num">4</span>
          LaTeX Code
        </span>
      </div>

      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
        <select style={selectStyle} value={opts.environment}
          onChange={(e) => setOpts((o) => ({ ...o, environment: e.target.value as FigureEnvironment }))}>
          <option value="figure*">figure*（2段組）</option>
          <option value="figure">figure（1段組）</option>
        </select>
        <select style={selectStyle} value={opts.placement}
          onChange={(e) => setOpts((o) => ({ ...o, placement: e.target.value as FigurePlacement }))}>
          {(['tb', 'htbp', 'h', 't', 'b', 'p'] as FigurePlacement[]).map((p) => (
            <option key={p} value={p}>[{p}]</option>
          ))}
        </select>
        <select style={selectStyle} value={opts.widthFraction}
          onChange={(e) => setOpts((o) => ({ ...o, widthFraction: Number(e.target.value) }))}>
          {[1.0, 0.8, 0.6, 0.5, 0.4].map((f) => (
            <option key={f} value={f}>{Math.round(f * 100)}%</option>
          ))}
        </select>
        <select style={selectStyle} value={opts.widthUnit}
          onChange={(e) => setOpts((o) => ({ ...o, widthUnit: e.target.value as FigureWidthUnit }))}>
          <option value="linewidth">\linewidth</option>
          <option value="textwidth">\textwidth</option>
          <option value="columnwidth">\columnwidth</option>
        </select>
        <select style={selectStyle} value={opts.wrapStyle}
          onChange={(e) => setOpts((o) => ({ ...o, wrapStyle: e.target.value as FigureWrapStyle }))}>
          <option value="center-env">center環境</option>
          <option value="centering">\centering</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {doneItems.map((item) => (
          <LatexCodeItem key={item.id} item={item} opts={opts} />
        ))}
      </div>
    </div>
  )
}

function LatexCodeItem({ item, opts }: { item: FigureFileItem; opts: FigureLatexOptions }) {
  const filename = item.resultFileName ?? item.name
  const [caption, setCaption] = useState('')
  const [label, setLabel] = useState(`fig:${slugify(baseName(filename))}`)
  const [copied, setCopied] = useState(false)

  const code = generateFigureLatex(filename, caption, label, opts)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="batch-dl-row" data-testid="latex-code-item">
      <span className="batch-dl-label">{filename}</span>
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          style={inputStyle}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          style={inputStyle}
        />
      </div>
      <textarea
        readOnly
        value={code}
        rows={5}
        style={{
          fontSize: '.75rem', fontFamily: "'Consolas', 'JetBrains Mono', monospace",
          minHeight: 'auto', background: '#FAFAFA', border: '1.5px solid var(--border)',
          borderRadius: 'var(--rs)', padding: '.5rem .75rem', color: 'var(--text)',
        }}
      />
      <button className="download-btn-sm" onClick={handleCopy} style={{ width: '100%' }}>
        {copied ? 'コピーしました ✓' : 'LaTeXコードをコピー'}
      </button>
    </div>
  )
}
