// Lazy-loads tesseract.js and OCRs an image in the browser, returning raw
// text. Domain-specific structuring (grid detection, line splitting, ...) is
// left to the caller — Chart's own tesseractWorker builds a chart-specific
// grid, which doesn't generalize to Table/Citation's very different shapes.
export async function runTesseract(b64: string): Promise<string> {
  const dataUrl = `data:image/png;base64,${b64}`
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, { logger: () => {} })
  const { data: { text } } = await worker.recognize(dataUrl)
  await worker.terminate()
  return text.trim()
}
