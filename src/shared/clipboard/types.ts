// Single-slot cross-module data bus (docs/02-integrations.md §3.1). Only the
// 'figure' variant is implemented so far (Chart → Figure Converter, Phase 5) —
// add further variants here when a real sender/receiver pair needs them,
// rather than speculatively declaring shapes with no consumer.
export type ClipboardItem = {
  type: 'figure'
  format: 'png' | 'svg'
  blob: Blob
  sourceModule: 'chart'
}
