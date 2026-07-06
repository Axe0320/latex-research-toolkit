export function parseTSV(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('\t'))
}
