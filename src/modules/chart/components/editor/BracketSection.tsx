import { useState } from 'react'
import type { BracketItem } from '../../types/figures'
import { runStatTest, type StatTestType } from '../../api/statApi'
import ImeInput from '../common/ImeInput'

interface Props {
  brackets: BracketItem[]
  nGroups: number
  groups: number[][]
  labels?: string[]
  onChange: (b: BracketItem[]) => void
}

type CorrectionType = 'none' | 'bonferroni' | 'holm'

const is = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid #6C63FF' : '1px solid #E5E7EB',
  borderRadius: 8, background: active ? '#EEF2FF' : 'white',
  color: active ? '#6C63FF' : '#6B7280', fontSize: 11, padding: '4px 10px',
  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
})
const selectStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
  background: 'white', cursor: 'pointer',
}

const TESTS: { val: StatTestType; label: string }[] = [
  { val: 'ttest',       label: 't検定' },
  { val: 'welch',       label: 'Welch t' },
  { val: 'mannwhitney', label: 'Mann-Whitney U' },
]

const CORRECTIONS: { val: CorrectionType; label: string }[] = [
  { val: 'none',        label: '補正なし' },
  { val: 'bonferroni',  label: 'Bonferroni' },
  { val: 'holm',        label: 'Holm' },
]

// Apply correction and return which pair indices are significant
function applyCorrection(
  pValues: number[],
  alpha: number,
  correction: CorrectionType,
): boolean[] {
  const m = pValues.length
  if (m === 0) return []

  if (correction === 'bonferroni') {
    const threshold = alpha / m
    return pValues.map(p => p <= threshold)
  }

  if (correction === 'holm') {
    // Sort indices by p-value ascending, apply step-down thresholds
    const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p)
    const significant = new Array(m).fill(false)
    for (let k = 0; k < m; k++) {
      const threshold = alpha / (m - k)
      if (order[k].p <= threshold) {
        significant[order[k].i] = true
      } else {
        break  // Holm: once a test fails, all remaining are non-significant
      }
    }
    return significant
  }

  // none
  return pValues.map(p => p <= alpha)
}

const AddButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}
    className="w-full text-sm py-1.5 rounded-lg transition-all"
    style={{ border: '1.5px dashed #C4B5FD', color: '#6C63FF', background: 'white' }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3FF' }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}>
    + 有意差ブラケット追加
  </button>
)

export default function BracketSection({ brackets, nGroups, groups, labels, onChange }: Props) {
  const [testType,   setTestType]   = useState<StatTestType>('ttest')
  const [alpha,      setAlpha]      = useState<0.05 | 0.01>(0.05)
  const [correction, setCorrection] = useState<CorrectionType>('none')
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoMsg,     setAutoMsg]     = useState<string | null>(null)

  const groupLabels = Array.from({ length: nGroups }, (_, i) => labels?.[i] ?? `Group ${i + 1}`)

  const getLabel = (p: number, threshold: number): string | null => {
    if (p < 0.001) return '***'
    if (p < 0.01)  return '**'
    if (threshold >= 0.05 && p < 0.05) return '*'
    return null
  }

  const runAutoTest = async () => {
    setAutoRunning(true)
    setAutoMsg(null)
    try {
      const pairs: [number, number][] = []
      for (let i = 0; i < nGroups; i++)
        for (let j = i + 1; j < nGroups; j++)
          pairs.push([i, j])

      const rawResults = await Promise.all(
        pairs.map(([i, j]) => {
          const g1 = groups[i] ?? []; const g2 = groups[j] ?? []
          if (g1.length < 2 || g2.length < 2) return Promise.resolve(null)
          return runStatTest(g1, g2, testType)
            .then((r) => ({ g1: i, g2: j, p: r.p_value }))
            .catch(() => null)
        })
      )

      const validResults = rawResults.filter(
        (r): r is { g1: number; g2: number; p: number } => r !== null
      )

      const pValues = validResults.map(r => r.p)
      const significant = applyCorrection(pValues, alpha, correction)

      const newBrackets: BracketItem[] = validResults
        .filter((_, k) => significant[k])
        .flatMap((r) => {
          const label = getLabel(r.p, alpha)
          if (!label) return []
          return [{ group1: r.g1, group2: r.g2, label, height: null }]
        })

      onChange(newBrackets)

      const corrLabel = correction === 'none' ? '' : ` (${correction === 'bonferroni' ? 'Bonferroni' : 'Holm'}補正)`
      setAutoMsg(
        newBrackets.length === 0
          ? `有意差なし${corrLabel} (全ペア p ≥ ${alpha})`
          : `${newBrackets.length} ペアに有意差あり${corrLabel}`
      )
    } catch {
      setAutoMsg('APIに接続できませんでした')
    } finally {
      setAutoRunning(false)
    }
  }

  const add    = () => onChange([...brackets, { group1: 0, group2: Math.min(1, nGroups - 1), label: '*', height: null }])
  const remove = (i: number) => onChange(brackets.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<BracketItem>) => {
    const next = [...brackets]; next[i] = { ...next[i], ...patch }; onChange(next)
  }

  return (
    <div className="space-y-3">

      {/* ブラケット一覧 */}
      {brackets.length > 0 && (
        <div className="space-y-2">
          {brackets.map((b, i) => (
            <div key={i} className="p-2 rounded-lg space-y-1.5" style={{ border: '1px solid #E5E7EB' }}>
              {/* 1行目: グループ選択 */}
              <div className="flex items-end gap-1">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-400 mb-0.5">グループ1</label>
                  <select value={b.group1} onChange={(e) => update(i, { group1: Number(e.target.value) })}
                    className="w-full text-sm px-2 py-1 truncate" style={selectStyle}>
                    {groupLabels.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                  </select>
                </div>
                <span className="text-xs text-gray-400 pb-1.5 shrink-0">→</span>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-400 mb-0.5">グループ2</label>
                  <select value={b.group2} onChange={(e) => update(i, { group2: Number(e.target.value) })}
                    className="w-full text-sm px-2 py-1 truncate" style={selectStyle}>
                    {groupLabels.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                  </select>
                </div>
              </div>
              {/* 2行目: ラベル + 削除 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-400 mb-0.5">ラベル</label>
                  <ImeInput value={b.label} onValueChange={(v) => update(i, { label: v })}
                    className="w-full text-sm px-2 py-1" placeholder="*" />
                </div>
                <button onClick={() => remove(i)} className="text-xs px-2 py-1 rounded-lg shrink-0 mt-4"
                  style={{ color: '#EF4444', border: '1px solid #FCA5A5', background: '#FFF5F5' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* + 有意差ブラケット追加（一覧の下） */}
      <AddButton onClick={add} />

      {/* 区切り */}
      <div style={{ borderTop: '1px dashed #E5E7EB', marginTop: 4 }} />

      {/* 検定設定 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">検定の種類</label>
        <div className="flex gap-1 flex-wrap">
          {TESTS.map(({ val, label }) => (
            <button key={val} onClick={() => setTestType(val)} style={is(testType === val)}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">有意水準 (α)</label>
        <div className="flex gap-1">
          {([0.05, 0.01] as const).map((a) => (
            <button key={a} onClick={() => setAlpha(a)} style={is(alpha === a)}>α = {a}</button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {alpha === 0.05
            ? 'p<0.05→* / p<0.01→** / p<0.001→*** でブラケット生成'
            : 'p<0.01→** / p<0.001→*** のみ生成（p<0.05 は有意差なし扱い）'}
        </p>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">多重比較補正</label>
        <div className="flex gap-1 flex-wrap">
          {CORRECTIONS.map(({ val, label }) => (
            <button key={val} onClick={() => setCorrection(val)} style={is(correction === val)}>{label}</button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {correction === 'none'       && '補正なし（2グループ比較時はこれで十分）'}
          {correction === 'bonferroni' && `閾値 = α/${'{'}m{'}'} (m=比較ペア数)。最も保守的な補正`}
          {correction === 'holm'       && 'p値を昇順ソートし段階的に閾値を緩和。Bonferroniより検出力が高い'}
        </p>
      </div>

      {/* 自動検定ボタン */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: '#F5F3FF', border: '1px solid #EDE9FE' }}>
        <p className="text-xs text-gray-500">全グループ間の組み合わせを検定し、有意なペアのブラケットを自動生成します。</p>
        <button
          onClick={runAutoTest}
          disabled={autoRunning}
          className="w-full text-sm font-semibold py-2 rounded-lg transition-all"
          style={{ background: autoRunning ? '#EDE9FE' : '#6C63FF', color: 'white', opacity: autoRunning ? 0.7 : 1 }}
        >
          {autoRunning ? '検定中...' : '自動検定を実行'}
        </button>
        {autoMsg && (
          <p className="text-xs text-center"
            style={{ color: autoMsg.includes('なし') || autoMsg.includes('接続') ? '#6B7280' : '#059669' }}>
            {autoMsg}
          </p>
        )}
      </div>

      {/* + 有意差ブラケット追加（自動検定の下） */}
      <AddButton onClick={add} />

    </div>
  )
}
