import { useCallback, useEffect, useState } from 'react'

interface ToastProps {
  message: string
  visible: boolean
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={
        'fixed bottom-8 right-8 flex items-center gap-2 rounded-md bg-[#111827] text-white text-sm font-medium px-4 py-3 shadow-lg transition-all pointer-events-none z-[100] ' +
        (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')
      }
    >
      <span className="w-[7px] h-[7px] rounded-full bg-[#10B981] shrink-0" />
      {message}
    </div>
  )
}

export function useToast(durationMs = 2200) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(t)
  }, [visible, durationMs])

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
  }, [])

  return { message, visible, show }
}
