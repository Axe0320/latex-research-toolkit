export function parseSvgDimensions(svgText: string): { width: number; height: number } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement

  const vb = svg.getAttribute('viewBox')
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/)
    const w = parseFloat(parts[2] ?? '0')
    const h = parseFloat(parts[3] ?? '0')
    if (w > 0 && h > 0) return { width: w, height: h }
  }

  const w = parseFloat(svg.getAttribute('width') ?? '0')
  const h = parseFloat(svg.getAttribute('height') ?? '0')
  if (w > 0 && h > 0) return { width: w, height: h }

  return { width: 800, height: 600 }
}
