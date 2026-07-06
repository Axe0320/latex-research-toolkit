// Canvas-based image preprocessing: resize to max 1280px and boost contrast.
// Runs entirely in the browser so the backend no longer needs Pillow.
export async function preprocessImageB64(b64: string): Promise<string> {
  const dataUrl = `data:image/png;base64,${b64}`
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1280
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (Math.max(w, h) > MAX) {
        const ratio = MAX / Math.max(w, h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(b64); return }
      ctx.filter = 'contrast(1.2)'
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png').split(',')[1] ?? b64)
    }
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = dataUrl
  })
}
