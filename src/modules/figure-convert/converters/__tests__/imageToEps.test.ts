import { describe, it, expect } from 'vitest'
import { calcEpsBBox, rgbaToHex, buildEps } from '../imageToEps'

describe('calcEpsBBox', () => {
  it('keeps the pixel size as-is (1:1 pt) when under the A4 max', () => {
    expect(calcEpsBBox(400, 300)).toEqual({ ptW: 400, ptH: 300 })
  })

  it('scales down proportionally when larger than A4 height (842pt)', () => {
    const { ptW, ptH } = calcEpsBBox(1684, 1000) // longest side is 2x the 842pt max
    expect(ptW).toBe(842)
    expect(ptH).toBe(500)
  })

  it('never scales up (scale is capped at 1)', () => {
    expect(calcEpsBBox(10, 10)).toEqual({ ptW: 10, ptH: 10 })
  })
})

describe('rgbaToHex', () => {
  it('encodes RGB channels as hex and drops alpha', () => {
    // one red-ish pixel: r=255 g=0 b=128 a=255
    const data = new Uint8ClampedArray([255, 0, 128, 255])
    expect(rgbaToHex(data)).toBe('ff0080')
  })

  it('encodes multiple pixels in sequence', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255])
    expect(rgbaToHex(data)).toBe('000000ffffff')
  })

  it('wraps output at 72 hex chars per line (PostScript convention)', () => {
    // 13 pixels × 6 hex chars = 78 chars, so line 1 should be exactly 72 chars
    const data = new Uint8ClampedArray(13 * 4).fill(0)
    const hex = rgbaToHex(data)
    const lines = hex.split('\n')
    expect(lines[0]).toHaveLength(72)
    expect(lines[1]).toHaveLength(78 - 72)
  })
})

describe('buildEps', () => {
  it('produces a well-formed EPS header with the given bounding box', () => {
    const eps = buildEps(100, 50, 90, 45, 'aabbcc')
    expect(eps).toContain('%!PS-Adobe-3.0 EPSF-3.0')
    expect(eps).toContain('%%BoundingBox: 0 0 90 45')
    expect(eps).toContain('%%HiResBoundingBox: 0.0 0.0 90.0 45.0')
    expect(eps).toContain('90 45 scale')
    expect(eps).toContain('100 50 8')
    expect(eps).toContain('aabbcc')
    expect(eps.trim().endsWith('%%EOF')).toBe(true)
  })

  it('flips the image vertically via a negative height in the image matrix', () => {
    const eps = buildEps(100, 50, 90, 45, 'aabbcc')
    expect(eps).toContain('[100 0 0 -50 0 50]')
  })
})
