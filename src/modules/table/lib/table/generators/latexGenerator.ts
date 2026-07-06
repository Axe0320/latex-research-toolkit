import type { TableModel, TableRow, TableNote } from '../types'
import { latexEscape } from '../../../../../shared/lib/latexEscape'
import { formatValue } from '../formatters/shared/formatValue'
import { type FormattingOptions, DEFAULT_OPTIONS } from '../formatters/options'

type BorderTemplate = FormattingOptions['borderTemplate']

export function latexGenerator(
  model: TableModel,
  opts: FormattingOptions = DEFAULT_OPTIONS
): string {
  const env = opts.environment ?? model.environment ?? 'table*'
  const colSpec = buildColSpec(model)
  const notes = model.notes ?? []
  const noteStyle = model.noteStyle ?? 'tnote'
  const hasNotes = notes.length > 0
  const useThreeparttable = hasNotes && noteStyle === 'tnote'

  const lines: string[] = []
  const postLines: string[] = []  // \footnotetext after \end{table*}

  // Required packages
  const pkgs = detectRequiredPackages(model, opts)
  if (pkgs.length > 0) {
    lines.push('% Required Packages:')
    pkgs.forEach(p => lines.push(`% ${p}`))
  }

  lines.push(`\\begin{${env}}[tb]`)
  lines.push(`\\caption{${latexEscape(model.title)}}`)
  lines.push(`\\label{${latexEscape(model.label)}}`)
  lines.push('\\begin{center}')

  if (useThreeparttable) lines.push('\\begin{threeparttable}')

  lines.push(`\\begin{tabular}{${colSpec}}`)

  const visibleRows = model.rows.filter(r => !r.cells.every(c => c.hidden))
  visibleRows.forEach((row, idx) => {
    const isLast = idx === visibleRows.length - 1
    const lineBefore = getLineBefore(idx, row, opts.borderTemplate)
    if (lineBefore) lines.push(lineBefore)
    lines.push(buildRow(row, opts, notes, noteStyle))
    const lineAfter = getLineAfter(isLast, row, opts.borderTemplate)
    if (lineAfter) lines.push(lineAfter)
  })

  lines.push('\\end{tabular}')

  if (useThreeparttable) {
    lines.push('\\begin{tablenotes}')
    notes.forEach(n => {
      lines.push(`\\item[${n.marker}] ${latexEscape(n.text)}`)
    })
    lines.push('\\end{tablenotes}')
    lines.push('\\end{threeparttable}')
  }

  lines.push('\\end{center}')
  lines.push(`\\end{${env}}`)

  // footnote mode: \footnotetext after \end{table*}
  if (hasNotes && noteStyle === 'footnote') {
    notes.forEach((n, i) => {
      postLines.push(`\\footnotetext[${i + 1}]{${latexEscape(n.text)}}`)
    })
  }

  return [...lines, ...postLines].join('\n')
}

function getLineBefore(rowIdx: number, row: TableRow, template: BorderTemplate): string | null {
  if (rowIdx === 0) return tableTopLine(template)
  if (row.topBorder === 'none') return null
  if (row.topBorder === 'hline') return '\\hline'
  if (row.topBorder === 'midrule') return '\\midrule'
  if (row.separatorTop) {
    if (template === 'academic') return '\\midrule'
    if (template === 'classic') return '\\hline'
  }
  if (template === 'full') return '\\hline'
  return null
}

function getLineAfter(isLast: boolean, row: TableRow, template: BorderTemplate): string | null {
  if (isLast) return tableBottomLine(template)
  if (row.bottomBorder === 'none') return null
  if (row.bottomBorder === 'hline') return '\\hline'
  if (row.bottomBorder === 'midrule') return '\\midrule'
  if (row.separatorBottom) {
    if (template === 'academic') return '\\midrule'
    if (template === 'classic') return '\\hline'
  }
  if (template === 'full') return '\\hline'
  return null
}

function tableTopLine(template: BorderTemplate): string {
  return (template === 'academic' || template === 'minimal') ? '\\toprule' : '\\hline'
}
function tableBottomLine(template: BorderTemplate): string {
  return (template === 'academic' || template === 'minimal') ? '\\bottomrule' : '\\hline'
}

function detectRequiredPackages(model: TableModel, opts: FormattingOptions): string[] {
  const pkgs: string[] = []
  const notes = model.notes ?? []
  const noteStyle = model.noteStyle ?? 'tnote'

  // booktabs
  const usesBooktabs =
    opts.borderTemplate === 'academic' ||
    opts.borderTemplate === 'minimal' ||
    model.rows.some(r => r.bottomBorder === 'midrule' || r.topBorder === 'midrule')
  if (usesBooktabs) pkgs.push('\\usepackage{booktabs}')

  // xcolor
  if (model.rows.some(r => r.cells.some(c => c.backgroundColor != null)))
    pkgs.push('\\usepackage[table]{xcolor}')

  // threeparttable
  if (notes.length > 0 && noteStyle === 'tnote')
    pkgs.push('\\usepackage{threeparttable}')

  // makecell — needed when any cell value contains a newline
  if (model.rows.some(r => r.cells.some(c => c.value.includes('\n'))))
    pkgs.push('\\usepackage{makecell}')

  return pkgs
}

// latexEscape is applied per-line to avoid double-escaping inside \makecell
function wrapMakecell(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n')
  if (!normalized.includes('\n')) return latexEscape(normalized)
  const escapedLines = normalized.split('\n').map(line => latexEscape(line))
  return `\\makecell{${escapedLines.join(' \\\\ ')}}`
}

function buildColSpec(model: TableModel): string {
  const refRow = model.rows.find(r => r.rowType !== 'header') ?? model.rows.find(r => r.rowType === 'header')
  if (!refRow) return 'l'
  return refRow.cells.filter(c => !c.hidden).map(c => alignToSpec(c.align)).join('')
}

function alignToSpec(align: 'left' | 'center' | 'right' | undefined): string {
  if (align === 'right') return 'r'
  if (align === 'center') return 'c'
  return 'l'
}

function buildRow(
  row: TableRow,
  opts: FormattingOptions,
  notes: TableNote[],
  noteStyle: 'tnote' | 'footnote'
): string {
  const visibleCells = row.cells.filter(c => !c.hidden)
  const cells = visibleCells.map(cell => {
    const raw = row.rowType === 'header' ? cell.value : formatValue(cell.value, opts)
    let value = wrapMakecell(raw)
    if (cell.bold)            value = `\\textbf{${value}}`
    if (cell.italic)          value = `\\textit{${value}}`
    if (cell.underline)       value = `\\underline{${value}}`
    if (cell.backgroundColor) value = `\\cellcolor{${cell.backgroundColor}}${value}`

    // Note markers — appended after all formatting
    const markers = cell.noteMarkers ?? []
    if (markers.length > 0) {
      if (noteStyle === 'tnote') {
        value += `\\tnote{${markers.join(',')}}`
      } else {
        // footnote: \footnotemark[n] for each marker (req.1: consecutive output)
        markers.forEach(m => {
          const idx = notes.findIndex(n => n.marker === m)
          value += `\\footnotemark[${idx >= 0 ? idx + 1 : 1}]`
        })
      }
    }

    return value
  })
  return cells.join(' & ') + ' \\\\'
}
