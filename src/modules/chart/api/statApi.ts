export type StatTestType = 'mannwhitney' | 'ttest' | 'welch'

export interface StatResult {
  p_value: number
  label: string
}

export async function runStatTest(
  group1: number[],
  group2: number[],
  test: StatTestType,
): Promise<StatResult> {
  const res = await fetch('/api/stat_test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group1, group2, test }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}
