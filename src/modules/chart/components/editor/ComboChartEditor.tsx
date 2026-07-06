import { useState } from 'react'
import type { ComboState, ComboParams } from '../../types/figures'
import SizeEditor from './SizeEditor'
import HexColorEditor from './HexColorEditor'
import { PaletteButtons } from './colorPalettes'
import ImeInput from '../common/ImeInput'

interface Props {
  figure: ComboState
  onChange: (patch: Partial<ComboParams>) => void
  onReset: () => void
}

type Section = 'text' | 'display' | 'axis' | 'size'
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',    label: 'テキスト' },
  { key: 'display', label: '表示' },
  { key: 'axis',    label: '軸' },
  { key: 'size',    label: 'サイズ' },
]

const LEGEND_LOCS = [
  { val: 'best', label: '自動' }, { val: 'upper right', label: '右上' },
  { val: 'upper left', label: '左上' }, { val: 'lower right', label: '右下' },
  { val: 'lower left', label: '左下' }, { val: 'outside', label: '外側' },
]
const GRID_STYLES = [
  { val: '--', label: '破線' }, { val: '-', label: '実線' },
  { val: ':', label: '点線' }, { val: '-.', label: '一点鎖' },
]
const MARKERS = ['none', 'o', 's', '^', 'D', 'v', 'P']

const is = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid #6C63FF' : '1px solid #E5E7EB',
  borderRadius: 8, background: active ? '#EEF2FF' : 'white',
  color: active ? '#6C63FF' : '#6B7280', fontSize: 11, padding: '4px 10px',
  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
})
const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', transition: 'border-color 0.15s',
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
          <input type="number" step="any" value={value![0]} onChange={(e) => onChange([Number(e.target.value), value![1]])} className="w-full text-sm px-2 py-1" style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
          <span className="text-xs text-gray-400 text-center">〜</span>
          <input type="number" step="any" value={value![1]} onChange={(e) => onChange([value![0], Number(e.target.value)])} className="w-full text-sm px-2 py-1" style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }} />
        </div>
      )}
    </div>
  )
}

export default function ComboChartEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')
  const p = figure.params
  const nBars  = figure.data.bar_series.length
  const nLines = figure.data.line_series.length

  const setBarColor = (i: number, c: string) => {
    const next = [...p.colors_bar]; while (next.length <= i) next.push('#6C63FF'); next[i] = c; onChange({ colors_bar: next })
  }
  const setLineColor = (i: number, c: string) => {
    const next = [...p.colors_line]; while (next.length <= i) next.push('#EF4444'); next[i] = c; onChange({ colors_line: next })
  }
  const setMarker = (i: number, m: string) => {
    const next = [...p.markers]; while (next.length <= i) next.push('o'); next[i] = m; onChange({ markers: next })
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end mb-2">
        <button onClick={onReset} className="text-xs font-semibold px-3 py-1.5"
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
                  <div><label className="block text-xs text-gray-500 mb-1">左Y軸ラベル（棒）</label>
                    <ImeInput value={p.ylabel_left} onValueChange={(v) => onChange({ ylabel_left: v })} placeholder="左Y軸" className="w-full text-sm px-3 py-1.5" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">右Y軸ラベル（折れ線）</label>
                    <ImeInput value={p.ylabel_right} onValueChange={(v) => onChange({ ylabel_right: v })} placeholder="右Y軸" className="w-full text-sm px-3 py-1.5" /></div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">フォントサイズ</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={8} max={24} value={p.fontsize} onChange={(e) => onChange({ fontsize: Number(e.target.value) })} className="flex-1 accent-[#6C63FF]" />
                      <span className="text-xs text-gray-500 w-8">{p.fontsize}pt</span>
                    </div>
                  </div>
                </>
              )}

              {key === 'display' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">バー幅</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={0.1} max={1} step={0.05} value={p.bar_width} onChange={(e) => onChange({ bar_width: Number(e.target.value) })} className="flex-1 accent-[#6C63FF]" />
                      <span className="text-xs text-gray-500 w-8">{p.bar_width.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">折れ線の太さ</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={0.5} max={5} step={0.5} value={p.linewidth} onChange={(e) => onChange({ linewidth: Number(e.target.value) })} className="flex-1 accent-[#6C63FF]" />
                      <span className="text-xs text-gray-500 w-8">{p.linewidth}</span>
                    </div>
                  </div>
                  <PaletteButtons currentColors={figure.params.colors_bar} onChange={(colors) => onChange({ colors_bar: colors, colors_line: [...colors].reverse() })} />
                  {nBars > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">棒の色</label>
                      <div className="space-y-2">
                        {Array.from({ length: nBars }, (_, i) => (
                          <div key={i} className="space-y-1">
                            <span className="text-xs text-gray-400">{figure.data.bar_series[i]?.name || `棒 ${i+1}`}</span>
                            <HexColorEditor value={p.colors_bar[i] ?? '#6C63FF'} paletteColors={figure.params.colors_bar} onChange={(c) => setBarColor(i, c)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {nLines > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">折れ線の色</label>
                      <div className="space-y-2">
                        {Array.from({ length: nLines }, (_, i) => (
                          <div key={i} className="space-y-1">
                            <span className="text-xs text-gray-400">{figure.data.line_series[i]?.name || `折れ線 ${i+1}`}</span>
                            <HexColorEditor value={p.colors_line[i] ?? '#EF4444'} paletteColors={figure.params.colors_line} onChange={(c) => setLineColor(i, c)} />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {MARKERS.map((m) => (
                                <button key={m} onClick={() => setMarker(i, m)} style={is((p.markers[i] ?? 'o') === m)}>{m === 'none' ? 'なし' : m}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">凡例の位置</label>
                    <div className="flex flex-wrap gap-1">
                      {LEGEND_LOCS.map(({ val, label: lbl }) => (
                        <button key={val} onClick={() => onChange({ legend_loc: val })} style={is(p.legend_loc === val)}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <Toggle label="グリッド線" value={p.show_grid} onChange={(v) => onChange({ show_grid: v })} />
                  {p.show_grid && (
                    <div className="flex flex-wrap gap-1">
                      {GRID_STYLES.map(({ val, label: lbl }) => (
                        <button key={val} onClick={() => onChange({ grid_linestyle: val })} style={is(p.grid_linestyle === val)}>{lbl}</button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {key === 'axis' && (
                <>
                  <LimInput label="X軸範囲" value={p.xlim} onChange={(v) => onChange({ xlim: v })} />
                  <LimInput label="左Y軸範囲（棒）" value={p.ylim_left} onChange={(v) => onChange({ ylim_left: v })} />
                  <LimInput label="右Y軸範囲（折れ線）" value={p.ylim_right} onChange={(v) => onChange({ ylim_right: v })} />
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
