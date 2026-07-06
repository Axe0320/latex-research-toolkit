import { useState } from 'react'
import type { BoxState, BoxParams } from '../../types/figures'
import ImeInput from '../common/ImeInput'
import SizeEditor from './SizeEditor'
import HexColorEditor from './HexColorEditor'
import { PaletteButtons } from './colorPalettes'
import BracketSection from './BracketSection'

interface Props {
  figure: BoxState
  onChange: (patch: Partial<BoxParams>) => void
  onReset: () => void
}

type Section = 'text' | 'display' | 'bracket' | 'axis' | 'size'
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',    label: 'テキスト' },
  { key: 'display', label: '表示' },
  { key: 'bracket', label: '有意差' },
  { key: 'axis',    label: '軸' },
  { key: 'size',    label: 'サイズ' },
]

const GRID_STYLES = [
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
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
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


export default function BoxEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')
  const p = figure.params
  const nGroups = figure.data.groups.length

  const setColor = (i: number, color: string) => {
    const next = [...p.colors]; while (next.length <= i) next.push('#6C63FF')
    next[i] = color; onChange({ colors: next })
  }

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
          style={{ border: open === key ? '1px solid #C4B5FD' : '1px solid #E5E7EB', borderRadius: 10 }}>
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
                    <ImeInput value={p.xlabel} onValueChange={(v) => onChange({ xlabel: v })} placeholder="X軸" className="w-full text-sm px-3 py-1.5" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Y軸ラベル</label>
                    <ImeInput value={p.ylabel} onValueChange={(v) => onChange({ ylabel: v })} placeholder="Y軸" className="w-full text-sm px-3 py-1.5" /></div>
                  <Slider label="フォントサイズ" value={p.fontsize} min={8} max={24} unit="pt" onChange={(v) => onChange({ fontsize: v })} />
                  <Slider label="目盛りサイズ" value={p.tick_fontsize} min={6} max={20} unit="pt" onChange={(v) => onChange({ tick_fontsize: v })} />
                </>
              )}

              {key === 'display' && (
                <>
                  <PaletteButtons currentColors={figure.params.colors} onChange={(colors) => onChange({ colors })} />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">グループごとの色</label>
                    <div className="space-y-2">
                      {Array.from({ length: nGroups }, (_, i) => (
                        <div key={i} className="space-y-1">
                          <span className="text-xs text-gray-400 block">{p.labels[i] ?? `Group ${i + 1}`}</span>
                          <HexColorEditor value={p.colors[i] ?? '#6C63FF'} paletteColors={figure.params.colors} onChange={(c) => setColor(i, c)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">向き</label>
                    <div className="flex gap-1.5">
                      {[{ val: 'vertical', label: '縦' }, { val: 'horizontal', label: '横' }].map(({ val, label: lbl }) => (
                        <button key={val} onClick={() => onChange({ orientation: val as 'vertical' | 'horizontal' })} style={is(p.orientation === val)}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <Toggle label="ノッチ" value={p.notch} onChange={(v) => onChange({ notch: v })} />
                  <Toggle label="外れ値を表示" value={p.showfliers} onChange={(v) => onChange({ showfliers: v })} />
                  <Toggle label="中央値を表示" value={p.show_median} onChange={(v) => onChange({ show_median: v })} />
                  <Toggle label="平均値を表示 (◆)" value={p.show_mean} onChange={(v) => onChange({ show_mean: v })} />
                  <Toggle label="各値を表示 (●)" value={p.show_points} onChange={(v) => onChange({ show_points: v })} />
                  <Toggle label="グリッド線" value={p.show_grid} onChange={(v) => onChange({ show_grid: v })} />
                  {p.show_grid && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">グリッドスタイル</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {GRID_STYLES.map(({ val, label: lbl }) => (
                          <button key={val} onClick={() => onChange({ grid_linestyle: val })} style={is(p.grid_linestyle === val)}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {key === 'bracket' && (
                <BracketSection brackets={p.brackets} nGroups={nGroups} groups={figure.data.groups} labels={p.labels} onChange={(b) => onChange({ brackets: b })} />
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
