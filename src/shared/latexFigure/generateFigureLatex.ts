import { latexEscape } from '../lib/latexEscape'
import { DEFAULT_FIGURE_LATEX_OPTIONS, type FigureLatexOptions } from './types'

/**
 * Generates a \begin{figure}...\end{figure} wrapper around a converted/
 * exported image — the figure-module analogue of Table's latexGenerator.ts.
 * Used by both Figure Converter and Chart (連携#7, added on user request
 * after Phase 5).
 */
export function generateFigureLatex(
  filename: string,
  caption: string,
  label: string,
  opts: FigureLatexOptions = DEFAULT_FIGURE_LATEX_OPTIONS,
): string {
  const width = `${opts.widthFraction}\\${opts.widthUnit}`
  const graphic = `\\includegraphics[width=${width}]{${filename}}`
  const captionLabel = [
    caption.trim() ? `\\caption{${latexEscape(caption.trim())}}` : '',
    label.trim() ? `\\label{${latexEscape(label.trim())}}` : '',
  ].join('')

  const body = opts.wrapStyle === 'centering'
    ? [`\\centering`, graphic, captionLabel].filter(Boolean).join('\n')
    : [`\\begin{center}`, graphic, captionLabel, `\\end{center}`].filter(Boolean).join('\n')

  return [
    `\\begin{${opts.environment}}[${opts.placement}]`,
    body,
    `\\end{${opts.environment}}`,
  ].join('\n')
}
