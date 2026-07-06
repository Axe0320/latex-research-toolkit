import type { TableModel } from '../types'

export type SourceType =
  | 'csv'
  | 'tsv'
  | 'classification-report'
  | 'log'
  | 'manual'

export type TableSource = {
  id: string
  name: string
  sourceType: SourceType
  model: TableModel
  direction: 'rows' | 'columns'
}
