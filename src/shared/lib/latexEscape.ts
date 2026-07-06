const ESCAPE_CHARS: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
}

export function latexEscape(value: string): string {
  // Single pass over the original string: applying replacements sequentially
  // (one .replace() per character) would re-scan earlier replacements' output —
  // e.g. `\` → `\textbackslash{}` introduces `{`/`}` that a later pass would
  // then re-escape into `\{`/`\}`, corrupting the command.
  return value.replace(/[\\&%$#_{}]/g, (ch) => ESCAPE_CHARS[ch]!)
}
