import type { ConfusionMatrixParams } from '../../types/figures'
import ImeInput from '../common/ImeInput'

interface Props {
  params: ConfusionMatrixParams
  matrixSize: number
  onChange: (patch: Partial<ConfusionMatrixParams>) => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function LabelEditor({ params, matrixSize, onChange }: Props) {
  const labels = Array.from({ length: matrixSize }, (_, i) =>
    params.labels[i] ?? `Class ${i}`
  )

  const setLabel = (i: number, val: string) => {
    const next = [...labels]
    next[i] = val
    onChange({ labels: next })
  }

  return (
    <div className="space-y-4">
      {/* 軸ラベル */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">軸ラベル</p>
        <div>
          <label className="block text-xs text-gray-400 mb-1">x軸（列方向）</label>
          <ImeInput
            value={params.xlabel}
            onValueChange={(xlabel) => onChange({ xlabel })}
            className="w-full text-sm px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">y軸（行方向）</label>
          <ImeInput
            value={params.ylabel}
            onValueChange={(ylabel) => onChange({ ylabel })}
            className="w-full text-sm px-2 py-1.5"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={params.xlabel_top}
            onChange={(e) => onChange({ xlabel_top: e.target.checked })}
            className="accent-[#6C63FF]"
          />
          <span className="text-sm text-gray-700">x軸を上部に表示</span>
        </label>
      </div>

      {/* クラスラベル */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-1">クラスラベル</p>
        <p className="text-xs text-gray-400 mb-2">
          改行は{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">\n</code>
          {' '}で入力 → 入力欄下にプレビュー表示
        </p>
        <div className="space-y-2">
          {labels.map((label, i) => {
            const lines = label.split('\\n')
            const hasNewline = lines.length > 1
            return (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i}</span>
                  <ImeInput
                    value={label}
                    onValueChange={(val) => setLabel(i, val)}
                    className="flex-1 text-sm px-2 py-1"
                  />
                </div>
                {hasNewline && (
                  <div className="ml-6 mt-1 flex flex-wrap gap-1">
                    {lines.map((line, li) => (
                      <span
                        key={li}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: '#EEF2FF', color: '#6C63FF' }}
                      >
                        {line || '(空)'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 罫線 */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">罫線</p>
        <div>
          <label className="block text-xs text-gray-400 mb-1">太さ (px)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0} max={5} step={0.05}
              value={params.linewidths}
              onChange={(e) => onChange({ linewidths: Number(e.target.value) })}
              className="flex-1 accent-[#6C63FF]"
            />
            <input
              type="number"
              min={0} max={5} step={0.05}
              value={params.linewidths}
              onChange={(e) => {
                const v = Math.max(0, Math.min(5, Number(e.target.value)))
                if (!isNaN(v)) onChange({ linewidths: v })
              }}
              className="w-16 text-sm text-center px-1 py-1"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>なし (0)</span><span>太 (5)</span>
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-xs text-gray-400 mb-1">罫線の色</label>
          <div className="flex gap-2">
            {['black', 'white', 'gray', 'lightgray'].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ linecolor: c })}
                title={c}
                className="w-7 h-7 rounded transition-all"
                style={{
                  background: c,
                  border: params.linecolor === c ? '2px solid #6C63FF' : '2px solid #D1D5DB',
                  transform: params.linecolor === c ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* チェックボックス */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={params.normalize}
            onChange={(e) => onChange({ normalize: e.target.checked })}
            className="accent-[#6C63FF]"
          />
          <span className="text-sm text-gray-700">正規化</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={params.show_values}
            onChange={(e) => onChange({ show_values: e.target.checked })}
            className="accent-[#6C63FF]"
          />
          <span className="text-sm text-gray-700">値を表示</span>
        </label>
      </div>
    </div>
  )
}
