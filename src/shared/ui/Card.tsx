import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-md p-8 flex flex-col gap-6 ${className}`}>
      {children}
    </div>
  )
}
