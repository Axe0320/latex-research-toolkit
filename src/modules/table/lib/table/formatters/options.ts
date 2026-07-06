export type FormattingOptions = {
  decimalPrecision: number | 'auto'
  missingValue: '---' | 'N/A' | '-' | 'blank'
  environment: 'table' | 'table*'
  borderTemplate: 'academic' | 'classic' | 'full' | 'minimal'
}

export const DEFAULT_OPTIONS: FormattingOptions = {
  decimalPrecision: 'auto',
  missingValue: '---',
  environment: 'table*',
  borderTemplate: 'classic',
}
