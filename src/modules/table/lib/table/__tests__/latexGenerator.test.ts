import { describe, it, expect } from 'vitest'
import { latexGenerator } from '../generators/latexGenerator'
import { normalizeTable } from '../normalize/normalizeTable'
import { DEFAULT_OPTIONS, type FormattingOptions } from '../formatters/options'
import type { TableModel } from '../types'

function makeModel(rows: string[][], overrides: Partial<TableModel> = {}): TableModel {
  return { ...normalizeTable(rows), title: 'Results', label: 'tab:results', ...overrides }
}

describe('latexGenerator', () => {
  it('wraps the table in the requested environment and emits caption/label', () => {
    const model = makeModel([['Method', 'Acc'], ['Ours', '0.92']])
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    expect(latex).toContain('\\begin{table*}[tb]')
    expect(latex).toContain('\\end{table*}')
    expect(latex).toContain('\\caption{Results}')
    expect(latex).toContain('\\label{tab:results}')
    // Method column is text (left-aligned), Acc column is numeric (right-aligned)
    expect(latex).toContain('\\begin{tabular}{lr}')
  })

  it('honors opts.environment over model.environment', () => {
    const model = makeModel([['A'], ['1']], { environment: 'table*' })
    const latex = latexGenerator(model, { ...DEFAULT_OPTIONS, environment: 'table' })
    expect(latex).toContain('\\begin{table}[tb]')
  })

  it('escapes LaTeX special characters in title, label and cell values', () => {
    const model = makeModel([['A_1', 'B%'], ['x&y', '50%']], {
      title: '50% Accuracy & More',
      label: 'tab:a_b',
    })
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    expect(latex).toContain('\\caption{50\\% Accuracy \\& More}')
    expect(latex).toContain('\\label{tab:a\\_b}')
    expect(latex).toContain('A\\_1')
    expect(latex).toContain('x\\&y')
  })

  it('does not run header cells through numeric formatValue', () => {
    // A header literally named "10" should not become "10.0000" under auto precision.
    const model = makeModel([['10', 'B'], ['0.5', '1']])
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    expect(latex).toContain('\\textbf{10}')
    expect(latex).toContain('0.5000 & 1')
  })

  it('applies bold/italic/underline/background-color wrappers to cells', () => {
    const model = makeModel([['A'], ['1']])
    model.rows[1]!.cells[0]!.bold = true
    model.rows[1]!.cells[0]!.italic = true
    model.rows[1]!.cells[0]!.underline = true
    model.rows[1]!.cells[0]!.backgroundColor = 'yellow'
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    expect(latex).toContain('\\underline{\\textit{\\textbf{1}}}')
    expect(latex).toContain('\\cellcolor{yellow}\\underline')
  })

  it('skips hidden cells and adjusts the column spec accordingly', () => {
    const model = makeModel([['A', 'B'], ['1', '2']])
    model.rows.forEach((r) => { r.cells[1]!.hidden = true })
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    // Only column A survives hiding; its data ('1') is numeric so it's right-aligned.
    expect(latex).toContain('\\begin{tabular}{r}')
    expect(latex).not.toContain('B')
  })

  describe('border templates', () => {
    it('academic: toprule/midrule/bottomrule, no per-row hline', () => {
      const model = makeModel([['A'], ['1'], ['2']])
      const opts: FormattingOptions = { ...DEFAULT_OPTIONS, borderTemplate: 'academic' }
      const latex = latexGenerator(model, opts)
      expect(latex).toContain('\\toprule')
      expect(latex).toContain('\\midrule')
      expect(latex).toContain('\\bottomrule')
      expect(latex).not.toContain('\\hline')
    })

    it('classic: hline under the header, none between data rows', () => {
      const model = makeModel([['A'], ['1'], ['2']])
      const latex = latexGenerator(model, DEFAULT_OPTIONS) // classic is the default
      const hlineCount = (latex.match(/\\hline/g) ?? []).length
      // top border + header separator + bottom border = 3
      expect(hlineCount).toBe(3)
    })

    it('full: hline around every row (adjacent rows each contribute one, so internal boundaries get two)', () => {
      const model = makeModel([['A'], ['1'], ['2']])
      const opts: FormattingOptions = { ...DEFAULT_OPTIONS, borderTemplate: 'full' }
      const latex = latexGenerator(model, opts)
      const hlineCount = (latex.match(/\\hline/g) ?? []).length
      expect(hlineCount).toBe(6)
    })
  })

  it('adds the booktabs package comment only when needed', () => {
    const model = makeModel([['A'], ['1']])
    const classic = latexGenerator(model, DEFAULT_OPTIONS)
    expect(classic).not.toContain('booktabs')

    const academic = latexGenerator(model, { ...DEFAULT_OPTIONS, borderTemplate: 'academic' })
    expect(academic).toContain('\\usepackage{booktabs}')
  })

  it('wraps multi-line cell values in \\makecell and joins lines with \\\\', () => {
    const model = makeModel([['A'], ['line1']])
    model.rows[1]!.cells[0]!.value = 'line1\nline2'
    const latex = latexGenerator(model, DEFAULT_OPTIONS)
    expect(latex).toContain('\\usepackage{makecell}')
    expect(latex).toContain('\\makecell{line1 \\\\ line2}')
  })

  describe('table notes', () => {
    it('tnote style wraps the table in threeparttable and lists tablenotes', () => {
      const model = makeModel([['A'], ['1']], {
        notes: [{ id: 'n1', marker: '*', text: 'p < 0.05' }],
        noteStyle: 'tnote',
      })
      model.rows[1]!.cells[0]!.noteMarkers = ['*']
      const latex = latexGenerator(model, DEFAULT_OPTIONS)
      expect(latex).toContain('\\begin{threeparttable}')
      expect(latex).toContain('1\\tnote{*}')
      expect(latex).toContain('\\item[*] p < 0.05')
      expect(latex).toContain('\\usepackage{threeparttable}')
    })

    it('footnote style appends \\footnotetext after \\end{table*}', () => {
      const model = makeModel([['A'], ['1']], {
        notes: [{ id: 'n1', marker: '1', text: 'see appendix' }],
        noteStyle: 'footnote',
      })
      model.rows[1]!.cells[0]!.noteMarkers = ['1']
      const latex = latexGenerator(model, DEFAULT_OPTIONS)
      expect(latex).toContain('1\\footnotemark[1]')
      const afterEnd = latex.slice(latex.indexOf('\\end{table*}'))
      expect(afterEnd).toContain('\\footnotetext[1]{see appendix}')
    })
  })
})
