import { describe, it, expect } from 'vitest'
import { latexEscape } from '../latexEscape'

describe('latexEscape', () => {
  it('escapes each special character individually', () => {
    expect(latexEscape('&')).toBe('\\&')
    expect(latexEscape('%')).toBe('\\%')
    expect(latexEscape('$')).toBe('\\$')
    expect(latexEscape('#')).toBe('\\#')
    expect(latexEscape('_')).toBe('\\_')
    expect(latexEscape('{')).toBe('\\{')
    expect(latexEscape('}')).toBe('\\}')
    expect(latexEscape('\\')).toBe('\\textbackslash{}')
  })

  it('leaves plain text untouched', () => {
    expect(latexEscape('Overview of Our Approach')).toBe('Overview of Our Approach')
  })

  it('does not re-escape the braces introduced by a backslash expansion', () => {
    // Regression: a naive sequential-replace implementation escapes `\` to
    // `\textbackslash{}` first, then a later pass over `{`/`}` would corrupt
    // that into `\textbackslash\{\}`, which prints literal braces in the PDF.
    expect(latexEscape('a\\b')).toBe('a\\textbackslash{}b')
  })

  it('escapes multiple different special characters in one string', () => {
    expect(latexEscape('50% of a_b & c#1 costs $5')).toBe(
      '50\\% of a\\_b \\& c\\#1 costs \\$5',
    )
  })
})
