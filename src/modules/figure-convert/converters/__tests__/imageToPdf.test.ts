import { describe, it, expect } from 'vitest'
import { pixelsToPt, calcPageSize } from '../imageToPdf'

describe('pixelsToPt', () => {
  it('converts 72dpi pixels to points 1:1', () => {
    expect(pixelsToPt(300)).toBe(300)
  })

  it('converts using a custom dpi', () => {
    expect(pixelsToPt(300, 150)).toBe(144)
  })
})

describe('calcPageSize', () => {
  it('uses the image size as the page size when it fits within A4 height', () => {
    const { pageW, pageH, drawW, drawH, x, y } = calcPageSize(400, 300)
    expect({ pageW, pageH, drawW, drawH, x, y }).toEqual({
      pageW: 400, pageH: 300, drawW: 400, drawH: 300, x: 0, y: 0,
    })
  })

  it('scales down proportionally when the image exceeds the 842pt A4 max', () => {
    const { pageW, pageH } = calcPageSize(1684, 1000)
    expect(pageW).toBe(842)
    expect(pageH).toBe(500)
  })

  it('keeps zero margins (page size equals draw size)', () => {
    const { pageW, drawW, pageH, drawH } = calcPageSize(500, 200)
    expect(pageW).toBe(drawW)
    expect(pageH).toBe(drawH)
  })
})
