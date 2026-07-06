import type { VisionProvider } from './visionOcr'

// Shared brand-ish colors for OCR/AI-analysis provider buttons, applied
// identically across Chart's image OCR and Table/Citation's text AI解析 —
// so a given provider always reads as the same color everywhere.
export const PROVIDER_COLORS: Record<VisionProvider, string> = {
  claude: '#D97706',
  openai: '#059669',
  gemini: '#2563EB',
}

export const TESSERACT_COLOR = '#374151'
