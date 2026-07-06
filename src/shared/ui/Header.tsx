interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="text-center py-8 px-4">
      <h1 className="text-[clamp(1.9rem,5vw,2.75rem)] font-extrabold tracking-tight text-[#111827]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-base text-[#6B7280]">{subtitle}</p>}
    </header>
  )
}
