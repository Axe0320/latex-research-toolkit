import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-br from-accent to-[#8B5CF6] text-white shadow-[0_4px_14px_rgba(108,99,255,.35)] hover:shadow-[0_6px_20px_rgba(108,99,255,.45)] hover:brightness-[1.06] disabled:opacity-70',
  secondary:
    'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-accent hover:text-accent hover:bg-accent-light disabled:opacity-40',
}

export default function Button({ variant = 'secondary', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  )
}
