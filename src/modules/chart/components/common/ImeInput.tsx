import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onValueChange: (val: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export default function ImeInput({ value, onValueChange, placeholder, className, style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const composing = useRef(false)

  // Sync external value changes (e.g. reset button) directly into the DOM.
  // We never set `value={}` on the element so React never fights the IME.
  useEffect(() => {
    if (inputRef.current && !composing.current) {
      inputRef.current.value = value
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      className={className}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={(e) => {
        composing.current = false
        onValueChange(e.currentTarget.value)
      }}
      onChange={(e) => {
        if (!composing.current) onValueChange(e.target.value)
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB'
        if (!composing.current) onValueChange(e.currentTarget.value)
      }}
    />
  )
}
