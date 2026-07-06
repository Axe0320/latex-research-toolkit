import { useState, useRef, useCallback, useEffect } from 'react'

export interface DigitizerSeries {
  name: string
  x: number[]
  y: number[]
}

interface Props {
  imageUrl: string
  onComplete: (series: DigitizerSeries[]) => void
  onCancel: () => void
}

type CalibStep = 'x1' | 'x2' | 'y1' | 'y2' | 'points'

interface CalibPt {
  px: number
  py: number
  value: number
}

interface PixelPt { px: number; py: number }

const CALIB_ORDER: CalibStep[] = ['x1', 'x2', 'y1', 'y2']
const CALIB_LABELS: Record<string, string> = {
  x1: 'X軸 最小点をクリック',
  x2: 'X軸 最大点をクリック',
  y1: 'Y軸 最小点をクリック',
  y2: 'Y軸 最大点をクリック',
  points: 'データ点をクリック',
}

function pixelToData(
  px: number, py: number,
  x1: CalibPt, x2: CalibPt,
  y1: CalibPt, y2: CalibPt,
): { x: number; y: number } {
  const xRatio = (px - x1.px) / (x2.px - x1.px || 1)
  const yRatio = (py - y1.py) / (y2.py - y1.py || 1)
  return {
    x: x1.value + xRatio * (x2.value - x1.value),
    y: y1.value + yRatio * (y2.value - y1.value),
  }
}

export default function PointDigitizer({ imageUrl, onComplete, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [calibStep, setCalibStep] = useState<CalibStep>('x1')
  const [calib, setCalib] = useState<Partial<Record<CalibStep, CalibPt>>>({})
  const [pendingValue, setPendingValue] = useState('0')
  const [pendingClick, setPendingClick] = useState<PixelPt | null>(null)

  const [seriesName, setSeriesName] = useState('Series 1')
  const [allSeries, setAllSeries] = useState<DigitizerSeries[]>([])
  const [currentPoints, setCurrentPoints] = useState<PixelPt[]>([])

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // helper: draw text with white outline for readability on any background
    const drawLabel = (text: string, x: number, y: number, bold = false, size = 11) => {
      ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.strokeText(text, x, y)
      ctx.fillStyle = '#1F2937'
      ctx.fillText(text, x, y)
    }

    // Draw calib points
    const calibColors: Record<string, string> = { x1: '#E74C3C', x2: '#E74C3C', y1: '#3498DB', y2: '#3498DB' }
    CALIB_ORDER.forEach(k => {
      const pt = calib[k]
      if (!pt) return
      ctx.beginPath()
      ctx.arc(pt.px, pt.py, 9, 0, Math.PI * 2)
      ctx.fillStyle = calibColors[k]
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      drawLabel(k.toUpperCase(), pt.px + 11, pt.py - 5, true, 12)
    })

    // Draw pending click
    if (pendingClick) {
      ctx.beginPath()
      ctx.arc(pendingClick.px, pendingClick.py, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,165,0,0.85)'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw data points
    const x1 = calib.x1; const x2 = calib.x2; const y1 = calib.y1; const y2 = calib.y2
    currentPoints.forEach((pt, i) => {
      ctx.beginPath()
      ctx.arc(pt.px, pt.py, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#6C63FF'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
      if (x1 && x2 && y1 && y2) {
        const d = pixelToData(pt.px, pt.py, x1, x2, y1, y2)
        drawLabel(`(${d.x.toFixed(2)}, ${d.y.toFixed(2)})`, pt.px + 10, pt.py - 6)
      }
      ctx.fillStyle = 'white'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(String(i + 1), pt.px - 4, pt.py + 4)
    })
  }, [calib, pendingClick, currentPoints])

  useEffect(() => { drawOverlay() }, [drawOverlay])

  const handleImgLoad = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    drawOverlay()
  }

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY

    if (calibStep === 'points') {
      if (!calib.x1 || !calib.x2 || !calib.y1 || !calib.y2) return
      setCurrentPoints(prev => [...prev, { px, py }])
      return
    }

    // calibration step: record click, wait for value confirm
    setPendingClick({ px, py })
  }, [calibStep, calib])

  const confirmCalib = () => {
    if (!pendingClick) return
    const val = parseFloat(pendingValue)
    if (isNaN(val)) return
    const step = calibStep as 'x1' | 'x2' | 'y1' | 'y2'
    setCalib(prev => ({ ...prev, [step]: { px: pendingClick.px, py: pendingClick.py, value: val } }))
    setPendingClick(null)
    const idx = CALIB_ORDER.indexOf(step)
    if (idx < CALIB_ORDER.length - 1) setCalibStep(CALIB_ORDER[idx + 1])
    else setCalibStep('points')
  }

  const undoPoint = () => setCurrentPoints(prev => prev.slice(0, -1))

  const addSeries = () => {
    const x1 = calib.x1!; const x2 = calib.x2!; const y1 = calib.y1!; const y2 = calib.y2!
    if (!x1 || !x2 || !y1 || !y2) return
    const pts = currentPoints.map(pt => pixelToData(pt.px, pt.py, x1, x2, y1, y2))
    setAllSeries(prev => [...prev, { name: seriesName, x: pts.map(p => +p.x.toFixed(4)), y: pts.map(p => +p.y.toFixed(4)) }])
    setCurrentPoints([])
    setSeriesName(`Series ${allSeries.length + 2}`)
  }

  const handleComplete = () => {
    const x1 = calib.x1; const x2 = calib.x2; const y1 = calib.y1; const y2 = calib.y2
    const finalSeries = [...allSeries]
    if (currentPoints.length > 0 && x1 && x2 && y1 && y2) {
      const pts = currentPoints.map(pt => pixelToData(pt.px, pt.py, x1, x2, y1, y2))
      finalSeries.push({ name: seriesName, x: pts.map(p => +p.x.toFixed(4)), y: pts.map(p => +p.y.toFixed(4)) })
    }
    if (finalSeries.length > 0) onComplete(finalSeries)
  }

  const isCalibDone = calibStep === 'points'
  const calibProgress = CALIB_ORDER.filter(k => calib[k]).length

  return (
    <div className="flex flex-col gap-3 h-full" style={{ minHeight: 0 }}>
      {/* instruction bar */}
      <div className="flex items-center gap-3 py-2 px-3 rounded-xl text-xs"
        style={{ background: '#F0EFFE', color: '#1F2937' }}>
        <span className="font-bold">{CALIB_LABELS[calibStep]}</span>
        {!isCalibDone && (
          <span className="text-gray-500">軸の較正: {calibProgress}/4 完了</span>
        )}
      </div>

      {/* main area */}
      <div className="flex gap-3 flex-1" style={{ minHeight: 0 }}>
        {/* canvas */}
        <div className="flex-1 overflow-auto rounded-xl" style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img ref={imgRef} src={imageUrl} onLoad={handleImgLoad} style={{ display: 'none' }} alt="" />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ cursor: 'crosshair', maxWidth: '100%', display: 'block' }}
            />
          </div>
        </div>

        {/* side panel */}
        <div className="flex flex-col gap-2" style={{ width: 260, minWidth: 260 }}>
          {/* calibration value input */}
          {!isCalibDone && (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #E5E7EB' }}>
              <p className="text-xs font-semibold text-gray-700">{CALIB_LABELS[calibStep]}</p>
              {pendingClick ? (
                <>
                  <p className="text-xs text-gray-500">
                    クリック位置: ({pendingClick.px.toFixed(0)}, {pendingClick.py.toFixed(0)})
                  </p>
                  <p className="text-xs text-gray-600">データ値を入力:</p>
                  <input
                    type="number"
                    value={pendingValue}
                    onChange={e => setPendingValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmCalib()}
                    className="w-full text-xs px-2 py-1 rounded"
                    style={{ border: '1px solid #6C63FF', outline: 'none' }}
                    autoFocus
                  />
                  <button onClick={confirmCalib}
                    className="w-full text-xs py-1 rounded font-semibold text-white"
                    style={{ background: '#6C63FF' }}>確定</button>
                </>
              ) : (
                <p className="text-xs text-gray-500">画像上の点をクリックしてください</p>
              )}
            </div>
          )}

          {/* series controls (active in points mode) */}
          {isCalibDone && (
            <>
              <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #E5E7EB' }}>
                <p className="text-xs font-semibold text-gray-700">系列名</p>
                <input
                  type="text"
                  value={seriesName}
                  onChange={e => setSeriesName(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded"
                  style={{ border: '1px solid #E5E7EB', outline: 'none' }}
                />
                <p className="text-xs text-gray-500">{currentPoints.length} 点</p>
                <button onClick={undoPoint}
                  className="w-full text-xs py-1 rounded"
                  style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  1点戻す
                </button>
                <button onClick={addSeries}
                  className="w-full text-xs py-1 rounded font-semibold text-white"
                  style={{ background: '#43CFAA' }}>
                  系列を確定して追加
                </button>
              </div>

              {allSeries.length > 0 && (
                <div className="rounded-xl p-3 space-y-1" style={{ border: '1px solid #E5E7EB' }}>
                  <p className="text-xs font-semibold text-gray-700">確定済み系列</p>
                  {allSeries.map((s, i) => (
                    <p key={i} className="text-xs text-gray-600">• {s.name} ({s.x.length}点)</p>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-1 mt-auto">
            <button onClick={handleComplete}
              className="text-xs py-1.5 rounded-lg font-semibold text-white"
              style={{ background: '#6C63FF' }}>
              完了 ({(allSeries.length + (currentPoints.length > 0 ? 1 : 0))} 系列)
            </button>
            <button onClick={onCancel}
              className="text-xs py-1 rounded-lg"
              style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
