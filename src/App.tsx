import { Suspense, lazy, useEffect, useState } from 'react'
import { Header, TabBar, type TabDef } from './shared/ui'
import { APP_NAME } from './shared/theme'

const CitationModule = lazy(() => import('./modules/citation/CitationModule'))
const TableModule = lazy(() => import('./modules/table/TableModule'))
const FigureConvertModule = lazy(() => import('./modules/figure-convert/FigureConvertModule'))
const ChartModule = lazy(() => import('./modules/chart/ChartModule'))

const TABS: TabDef[] = [
  { id: 'citation', label: 'Citation' },
  { id: 'table', label: 'Table' },
  { id: 'figure', label: 'Figure' },
  { id: 'chart', label: 'Chart' },
]

const TAB_TO_PATH: Record<string, string> = {
  citation: '/citation',
  table: '/table',
  figure: '/figure',
  chart: '/chart',
}
const PATH_TO_TAB: Record<string, string> = {
  '/citation': 'citation',
  '/table': 'table',
  '/figure': 'figure',
  '/chart': 'chart',
}

function tabFromPath(pathname: string): string {
  return PATH_TO_TAB[pathname] ?? 'citation'
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => tabFromPath(window.location.pathname))
  // Tabs are added here on first visit and never removed, so switching away
  // and back preserves in-progress state instead of remounting the module.
  const [mountedTabs, setMountedTabs] = useState(() => new Set([activeTab]))

  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setMountedTabs(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
    const path = TAB_TO_PATH[id] ?? '/citation'
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
  }

  return (
    <div className="min-h-screen flex flex-col items-center pb-16">
      <Header title={APP_NAME} subtitle="Citation・Table・Figure・Chart を1つに統合した論文執筆支援ツール" />
      <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />

      <main className="w-full">
        <Suspense fallback={<div className="text-center text-sm text-[#6B7280] py-16">読み込み中...</div>}>
          {mountedTabs.has('citation') && (
            <div style={{ display: activeTab === 'citation' ? 'block' : 'none' }}>
              <CitationModule />
            </div>
          )}
          {mountedTabs.has('table') && (
            <div style={{ display: activeTab === 'table' ? 'block' : 'none' }}>
              <TableModule />
            </div>
          )}
          {mountedTabs.has('figure') && (
            <div style={{ display: activeTab === 'figure' ? 'block' : 'none' }}>
              <FigureConvertModule />
            </div>
          )}
          {mountedTabs.has('chart') && (
            <div style={{ display: activeTab === 'chart' ? 'block' : 'none' }}>
              <ChartModule />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}
