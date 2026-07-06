import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Header, TabBar, Toast, useToast, type TabDef } from './shared/ui'
import { APP_NAME } from './shared/theme'
import { onTabRequest } from './shared/navigation'

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

  // Lets a module (e.g. Chart's "Send to Figure Converter") switch tabs
  // without a prop-drilled reference to this component's own state.
  useEffect(() => onTabRequest(handleTabChange), [])

  const { message: toastMsg, visible: toastVisible, show: showToast } = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExportPaperAssets = useCallback(async () => {
    setExporting(true)
    try {
      // Dynamic import: keeps jszip + Table's LaTeX generator out of the
      // initial bundle, only loading them when this button is actually used.
      const { exportPaperAssets } = await import('./exportPaperAssets')
      const { fileCount } = await exportPaperAssets()
      showToast(fileCount > 0 ? 'paper-assets.zip をダウンロードしました' : 'エクスポートする内容がありません')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'エクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }, [showToast])

  return (
    <div className="min-h-screen flex flex-col items-center pb-16">
      <Header title={APP_NAME} subtitle="Citation・Table・Figure・Chart を1つに統合した論文執筆支援ツール" />
      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />
        <button
          onClick={handleExportPaperAssets}
          disabled={exporting}
          title="Citation Library・Tableの表・Chartの図をまとめてZIPでダウンロード"
          className="text-sm font-semibold px-4 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-accent hover:border-accent disabled:opacity-50 transition-colors"
        >
          {exporting ? '書き出し中...' : '📦 Export Paper Assets'}
        </button>
      </div>

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

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  )
}
