const ESCAPE_MAP: [RegExp, string][] = [
  [/\\/g, '\\textbackslash{}'],
  [/&/g, '\\&'],
  [/%/g, '\\%'],
  [/\$/g, '\\$'],
  [/#/g, '\\#'],
  [/_/g, '\\_'],
  [/\{/g, '\\{'],
  [/\}/g, '\\}'],
]

export function latexEscape(value: string): string {
  // Backslash must be replaced first to avoid double-escaping
  return ESCAPE_MAP.reduce((s, [re, replacement]) => s.replace(re, replacement), value)
}
