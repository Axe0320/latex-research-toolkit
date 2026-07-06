import { useState } from 'react'
import type { FeatureState, FeatureParams } from '../../types/figures'
import ImeInput from '../common/ImeInput'
import SizeEditor from './SizeEditor'
import HexColorEditor from './HexColorEditor'

interface Props {
  figure: FeatureState
  onChange: (patch: Partial<FeatureParams>) => void
  onReset: () => void
}

type Section = 'text' | 'display' | 'axis' | 'size'
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',    label: 'テキスト' },
  { key: 'display', label: '表示' },
  { key: 'axis',    label: '軸' },
  { key: 'size',    label: 'サイズ' },
]
const LINE_STYLES = [
  { val: '--', label: '破線' }, { val: '-', label: '実線' },
  { val: ':', label: '点線' }, { val: '-.', label: '一点鎖' },
]

const is = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid #6C63FF' : '1px solid #E5E7EB',
  borderRadius: 8, background: active ? '#EEF2FF' : 'white',
  color: active ? '#6C63FF' : '#6B7280', fontSize: 11, padding: '4px 10px',
  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
})
const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', transition: 'border-color 0.15s',
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#6C63FF]" />
        <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) onChange(v) }} className="w-14 text-sm text-center px-1 py-1" style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
        {unit && <span className="text-xs text-gray-400 w-5">{unit}</span>}
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500">{label}</label>
      <button onClick={() => onChange(!value)} className="w-10 h-5 rounded-full transition-all relative" style={{ background: value ? '#6C63FF' : '#D1D5DB' }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm" style={{ left: value ? '1.25rem' : '0.125rem' }} />
      </button>
    </div>
  )
}

function LimInput({ label, value, onChange }: { label: string; value: [number, number] | null; onChange: (v: [number, number] | null) => void }) {
  const enabled = value !== null
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-500">{label}</label>
        <button onClick={() => onChange(enabled ? null : [0, 1])} className="w-8 h-4 rounded-full transition-all relative" style={{ background: enabled ? '#6C63FF' : '#D1D5DB' }}>
          <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm" style={{ left: enabled ? '1rem' : '0.125rem' }} />
        </button>
      </div>
      {enabled && (
        <div className="grid grid-cols-[1fr_14px_1fr] items-center gap-1">
          <input type="number" step="any" value={value![0]} onChange={(e) => onChange([Number(e.target.value), value![1]])} className="w-full text-sm px-2 py-1" style={inputStyle} placeholder="最小" onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
          <span className="text-xs text-gray-400 text-center">〜</span>
          <input type="number" step="any" value={value![1]} onChange={(e) => onChange([value![0], Number(e.target.value)])} className="w-full text-sm px-2 py-1" style={inputStyle} placeholder="最大" onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
        </div>
      )}
    </div>
  )
}

export default function FeatureEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')
  const p = figure.params
  const nFeatures = figure.data.features.length

  return (
    <div className="space-y-1">
      <div className="flex justify-end mb-2">
        <button onClick={onReset} className="text-xs font-semibold px-3 py-1.5 transition-all"
          style={{ color: '#D97706', border: '1px solid #FDE68A', borderRadius: 6, background: '#FFFBEB' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF3C7' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFBEB' }}>
          リセット
        </button>
      </div>

      {SECTIONS.map(({ key, label }) => (
        <div key={key} className="overflow-hidden"
          style={{ border: open === key ? '1px solid #C4B5FD' : '1px solid #E5E7EB', borderRadius: 10, transition: 'border-color 0.15s' }}>
          <button className="w-full flex items-center justify-between px-3 py-2.5"
            style={{ background: open === key ? '#F5F3FF' : 'white' }}
            onClick={() => setOpen((prev) => prev === key ? null : key)}>
            <span className="text-xs font-semibold" style={{ color: open === key ? '#6C63FF' : '#374151' }}>{label}</span>
            <span style={{ color: open === key ? '#6C63FF' : '#9CA3AF' }}>{open === key ? '▲' : '▼'}</span>
          </button>

          {open === key && (
            <div className="px-3 pb-3 pt-1 space-y-3" style={{ borderTop: '1px solid #EDE9FE' }}>
              {key === 'text' && (
                <>
                  <div><label className="block text-xs text-gray-500 mb-1">タイトル</label>
                    <ImeInput value={p.title} onValueChange={(v) => onChange({ title: v })} placeholder="タイトルなし" className="w-full text-sm px-3 py-1.5" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">X軸ラベル</label>
                    <ImeInput value={p.xlabel} onValueChange={(v) => onChange({ xlabel: v })} placeholder="Importance" className="w-full text-sm px-3 py-1.5" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Y軸ラベル</label>
                    <ImeInput value={p.ylabel} onValueChange={(v) => onChange({ ylabel: v })} placeholder="Feature" className="w-full text-sm px-3 py-1.5" /></div>
                  <Slider label="フォントサイズ" value={p.fontsize} min={8} max={24} unit="pt" onChange={(v) => onChange({ fontsize: v })} />
                  <Slider label="目盛りサイズ" value={p.tick_fontsize} min={6} max={20} unit="pt" onChange={(v) => onChange({ tick_fontsize: v })} />
                </>
              )}

              {key === 'display' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">棒の色</label>
                    <HexColorEditor value={p.color} onChange={(c) => onChange({ color: c })} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">
                        上位N件
                        <span className="ml-1 text-gray-400 text-[10px]">(0=全件)</span>
                      </label>
                      <button onClick={() => onChange({ top_n: p.top_n !== null ? null : Math.min(10, nFeatures) })}
                        className="w-8 h-4 rounded-full transition-all relative"
                        style={{ background: p.top_n !== null ? '#6C63FF' : '#D1D5DB' }}>
                        <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm"
                          style={{ left: p.top_n !== null ? '1rem' : '0.125rem' }} />
                      </button>
                    </div>
                    {p.top_n !== null && (
                      <input type="number" min={1} max={nFeatures || 100} value={p.top_n}
                        onChange={(e) => { const v = Math.max(1, Number(e.target.value)); onChange({ top_n: v }) }}
                        className="w-full text-sm px-2 py-1" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
                    )}
                  </div>
                  <Toggle label="降順ソート" value={p.sort} onChange={(v) => onChange({ sort: v })} />
                  <Toggle label="値を表示" value={p.show_values} onChange={(v) => onChange({ show_values: v })} />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">向き</label>
                    <div className="flex gap-1.5">
                      {([['horizontal', '横（推奨）'], ['vertical', '縦']] as const).map(([val, lbl]) => (
                        <button key={val} onClick={() => onChange({ orientation: val })} style={is(p.orientation === val)}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <Toggle label="グリッド線" value={p.show_grid} onChange={(v) => onChange({ show_grid: v })} />
                  {p.show_grid && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">グリッドスタイル</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {LINE_STYLES.map(({ val, label: lbl }) => (
                          <button key={val} onClick={() => onChange({ grid_linestyle: val })} style={is(p.grid_linestyle === val)}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {key === 'axis' && (
                <>
                  <LimInput label="X軸範囲" value={p.xlim} onChange={(v) => onChange({ xlim: v })} />
                  <LimInput label="Y軸範囲" value={p.ylim} onChange={(v) => onChange({ ylim: v })} />
                </>
              )}

              {key === 'size' && <SizeEditor params={p} onChange={onChange} />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
