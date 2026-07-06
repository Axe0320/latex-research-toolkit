/** TSV/CSV → string[][] (trim済み) */
export function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(/\t|,/).map((c) => c.trim()))
    .filter((row) => row.some((c) => c !== ''))
}

/** セルを数値に変換。失敗したら NaN */
export function toNum(s: string): number {
  return parseFloat(s.replace(/,/g, ''))
}
