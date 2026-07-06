// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSvgDimensions } from '../parseSvgDimensions'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures')

describe('parseSvgDimensions', () => {
  it('reads width/height from a real sample SVG viewBox', () => {
    const svgText = readFileSync(join(FIXTURES, 'approach.svg'), 'utf-8')
    expect(parseSvgDimensions(svgText)).toEqual({ width: 800, height: 480 })
  })

  it('prefers viewBox over explicit width/height attributes when both are present', () => {
    const svg = '<svg viewBox="0 0 300 150" width="600" height="300"></svg>'
    expect(parseSvgDimensions(svg)).toEqual({ width: 300, height: 150 })
  })

  it('falls back to width/height attributes when there is no viewBox', () => {
    const svg = '<svg width="640" height="480"></svg>'
    expect(parseSvgDimensions(svg)).toEqual({ width: 640, height: 480 })
  })

  it('falls back to a default 800x600 when neither viewBox nor dimensions are usable', () => {
    expect(parseSvgDimensions('<svg></svg>')).toEqual({ width: 800, height: 600 })
  })

  it('falls back to defaults when viewBox is malformed (zero/negative size)', () => {
    expect(parseSvgDimensions('<svg viewBox="0 0 0 0"></svg>')).toEqual({ width: 800, height: 600 })
  })

  it('accepts comma-separated viewBox values', () => {
    expect(parseSvgDimensions('<svg viewBox="0,0,200,100"></svg>')).toEqual({ width: 200, height: 100 })
  })
})
