import type { FigureType } from '../types/figures'

// Attempt to parse a flat list of numbers into an n×n grid
function parseGrid(nums: number[]): number[][] | null {
  if (nums.length < 4) return null
  const n = Math.round(Math.sqrt(nums.length))
  if (n * n !== nums.length) return null
  const grid: number[][] = []
  for (let r = 0; r < n; r++) {
    grid.push(nums.slice(r * n, r * n + n))
  }
  return grid
}

function buildExtracted(text: string, type: FigureType): Record<string, unknown> {
  const nums = (text.match(/-?\d+\.?\d*/g) ?? []).map(Number).filter(n => !isNaN(n))

  if (type === 'confusion_matrix' || type === 'heatmap') {
    const grid = parseGrid(nums)
    if (grid) return { matrix: grid }
  }

  // Fallback: return raw text so OcrConfirm lets the user edit manually
  return {
    _raw: text,
    _note: 'Tesseract.js による抽出結果です。構造を手動で修正してください。',
  }
}

// Lazy-loads tesseract.js and runs OCR in the browser.
// Returns a partial extracted object compatible with OcrConfirm.
export async function runTesseract(
  b64: string,
  type: FigureType,
): Promise<Record<string, unknown>> {
  const dataUrl = `data:image/png;base64,${b64}`
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, { logger: () => {} })
  const { data: { text } } = await worker.recognize(dataUrl)
  await worker.terminate()
  return buildExtracted(text.trim(), type)
}
