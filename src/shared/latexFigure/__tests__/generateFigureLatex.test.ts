import { describe, it, expect } from 'vitest'
import { generateFigureLatex } from '../generateFigureLatex'
import { DEFAULT_FIGURE_LATEX_OPTIONS, type FigureLatexOptions } from '../types'

describe('generateFigureLatex', () => {
  it('wraps the graphic in the requested environment/placement and sizes it', () => {
    const code = generateFigureLatex('approach.png', 'Overview', 'fig:approach', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).toContain('\\begin{figure*}[tb]')
    expect(code).toContain('\\end{figure*}')
    expect(code).toContain('\\includegraphics[width=1\\linewidth]{approach.png}')
  })

  it('matches the example format the user provided', () => {
    const code = generateFigureLatex('Approach04.png', 'Overview of Our Approach', 'Approach', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).toBe(
      [
        '\\begin{figure*}[tb]',
        '\\begin{center}',
        '\\includegraphics[width=1\\linewidth]{Approach04.png}',
        '\\caption{Overview of Our Approach}\\label{Approach}',
        '\\end{center}',
        '\\end{figure*}',
      ].join('\n'),
    )
  })

  it('omits \\caption when caption is blank', () => {
    const code = generateFigureLatex('a.png', '', 'fig:a', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).not.toContain('\\caption')
    expect(code).toContain('\\label{fig:a}')
  })

  it('omits \\label when label is blank', () => {
    const code = generateFigureLatex('a.png', 'A caption', '', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).not.toContain('\\label')
    expect(code).toContain('\\caption{A caption}')
  })

  it('escapes LaTeX special characters in the caption', () => {
    const code = generateFigureLatex('a.png', '50% improvement & more', 'fig:a', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).toContain('\\caption{50\\% improvement \\& more}')
  })

  it('escapes LaTeX special characters in a manually-edited label', () => {
    // Regression: a hand-typed label like "fig:result_v2" must not leave a raw
    // `_`/`%` in \label{...} — LaTeX tokenizes macro arguments normally, so an
    // unescaped `_` errors and `%` comments out the rest of the line.
    const code = generateFigureLatex('a.png', 'Caption', 'fig:result_v2', DEFAULT_FIGURE_LATEX_OPTIONS)
    expect(code).toContain('\\label{fig:result\\_v2}')
  })

  it('uses \\centering instead of a center environment when wrapStyle is "centering"', () => {
    const opts: FigureLatexOptions = { ...DEFAULT_FIGURE_LATEX_OPTIONS, wrapStyle: 'centering' }
    const code = generateFigureLatex('a.png', 'Caption', 'fig:a', opts)
    expect(code).toContain('\\centering')
    expect(code).not.toContain('\\begin{center}')
  })

  it('honors widthFraction and widthUnit', () => {
    const opts: FigureLatexOptions = { ...DEFAULT_FIGURE_LATEX_OPTIONS, widthFraction: 0.5, widthUnit: 'textwidth' }
    const code = generateFigureLatex('a.png', 'Caption', 'fig:a', opts)
    expect(code).toContain('\\includegraphics[width=0.5\\textwidth]{a.png}')
  })

  it('honors the figure (non-starred) environment and placement', () => {
    const opts: FigureLatexOptions = { ...DEFAULT_FIGURE_LATEX_OPTIONS, environment: 'figure', placement: 'h' }
    const code = generateFigureLatex('a.png', 'Caption', 'fig:a', opts)
    expect(code).toContain('\\begin{figure}[h]')
    expect(code).toContain('\\end{figure}')
  })
})
