import { useState } from 'react'
import type { PieState, PieParams } from '../../types/figures'
import SizeEditor from './SizeEditor'
import HexColorEditor from './HexColorEditor'
import { PaletteButtons } from './colorPalettes'
import ImeInput from '../common/ImeInput'

interface Props {
  figure: PieState
  onChange: (patch: Partial<PieParams>) => void
  onReset: () => void
}

type Section = 'text' | 'display' | 'size'
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'text',    label: 'テキスト' },
  { key: 'display', label: '表示' },
  { key: 'size',    label: 'サイズ' },
]

const LEGEND_LOCS = [
  { val: 'none', label: 'なし' }, { val: 'best', label: '自動' },
  { val: 'upper right', label: '右上' }, { val: 'upper left', label: '左上' },
  { val: 'lower right', label: '右下' }, { val: 'outside', label: '外側' },
]

const is = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid #6C63FF' : '1px solid #E5E7EB',
  borderRadius: 8, background: active ? '#EEF2FF' : 'white',
  color: active ? '#6C63FF' : '#6B7280', fontSize: 11, padding: '4px 10px',
  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
})

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

function Slider({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#6C63FF]" />
        <span className="text-xs text-gray-500 w-10 text-right">{value}{unit}</span>
      </div>
    </div>
  )
}

export default function PieChartEditor({ figure, onChange, onReset }: Props) {
  const [open, setOpen] = useState<Section | null>('text')
  const p = figure.params
  const nSlices = figure.data.labels.length

  const setColor = (i: number, c: string) => {
    const next = [...p.colors]; while (next.length <= i) next.push('#6C63FF'); next[i] = c; onChange({ colors: next })
  }
  const setExplode = (i: number, v: number) => {
    const next = Array.from({ length: nSlices }, (_, j) => p.explode[j] ?? 0)
    next[i] = v
    onChange({ explode: next })
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
                  <Toggle label="パーセント表示" value={p.autopct} onChange={(v) => onChange({ autopct: v })} />
                  {p.autopct && (
                    <Slider label="パーセント位置（内側←→外側）" value={p.pctdistance} min={0.3} max={1.2} step={0.05} onChange={(v) => onChange({ pctdistance: v })} />
                  )}
                  <Toggle label="影" value={p.shadow} onChange={(v) => onChange({ shadow: v })} />
                  <Slider label="開始角度" value={p.startangle} min={0} max={360} unit="°" onChange={(v) => onChange({ startangle: v })} />
                  <Slider label="ドーナツ穴（0=円グラフ）" value={p.donut} min={0} max={0.8} step={0.05} onChange={(v) => onChange({ donut: v })} />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">凡例の位置</label>
                    <div className="flex flex-wrap gap-1">
                      {LEGEND_LOCS.map(({ val, label: lbl }) => (
                        <button key={val} onClick={() => onChange({ legend_loc: val })} style={is(p.legend_loc === val)}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <PaletteButtons currentColors={figure.params.colors} onChange={(colors) => onChange({ colors })} />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">スライスの色・飛び出し</label>
                    <div className="space-y-3">
                      {figure.data.labels.map((lbl, i) => (
                        <div key={i} className="space-y-1">
                          <span className="text-xs text-gray-400 block truncate">{lbl || `Slice ${i + 1}`}</span>
                          <HexColorEditor value={p.colors[i] ?? '#6C63FF'} paletteColors={figure.params.colors} onChange={(c) => setColor(i, c)} />
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 w-14 shrink-0">飛び出し</label>
                            <input type="range" min={0} max={0.3} step={0.02} value={p.explode[i] ?? 0}
                              onChange={(e) => setExplode(i, Number(e.target.value))}
                              className="flex-1 accent-[#6C63FF]" />
                            <span className="text-xs text-gray-500 w-8">{(p.explode[i] ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
