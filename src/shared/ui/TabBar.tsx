export interface TabDef {
  id: string
  label: string
  icon?: string
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <nav className="flex gap-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-1.5 max-w-fit mx-auto">
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold transition-colors ' +
              (isActive
                ? 'bg-white text-accent shadow-sm border border-[#E5E7EB]'
                : 'text-[#6B7280] hover:text-[#111827] bg-transparent border border-transparent')
            }
          >
            {tab.icon && <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
