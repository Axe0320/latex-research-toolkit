import type { TableModel } from '../types'
import { detect } from './detect'
import { parseCSV, parseTSV } from '../../../../../shared/lib/dataParsing'
import { parseClassificationReport } from './parseClassificationReport'
import { parseLog } from './parseLog'
import { normalizeTable } from '../normalize'

export function parseInput(text: string): TableModel | null {
  const format = detect(text)
  if (format === 'unknown') return null

  const raw = getRaw(text, format)
  if (!raw || raw.length === 0) return null

  return normalizeTable(raw)
}

function getRaw(
  text: string,
  format: ReturnType<typeof detect>
): string[][] | null {
  switch (format) {
    case 'tsv':                 return parseTSV(text)
    case 'csv':                 return parseCSV(text)
    case 'classification-report': return parseClassificationReport(text)
    case 'log':                 return parseLog(text)
    default:                    return null
  }
}
