export interface TabDef {
  id: string
  label: string
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav className="flex gap-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-1 max-w-fit mx-auto">
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={
              'px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ' +
              (isActive
                ? 'bg-white text-accent shadow-sm border border-[#E5E7EB]'
                : 'text-[#6B7280] hover:text-[#111827] bg-transparent border border-transparent')
            }
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
