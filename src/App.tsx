import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { TabBar, Toast, useToast, ModuleErrorBoundary, type TabDef } from './shared/ui'
import { APP_NAME } from './shared/theme'
import { onTabRequest } from './shared/navigation'
import { OcrSettings } from './shared/ocr'

const CitationModule = lazy(() => import('./modules/citation/CitationModule'))
const TableModule = lazy(() => import('./modules/table/TableModule'))
const FigureConvertModule = lazy(() => import('./modules/figure-convert/FigureConvertModule'))
const ChartModule = lazy(() => import('./modules/chart/ChartModule'))

const TABS: TabDef[] = [
  { id: 'citation', label: '参考文献', icon: '📚' },
  { id: 'table', label: '表', icon: '📋' },
  { id: 'figure', label: '画像変換', icon: '🖼️' },
  { id: 'chart', label: 'グラフ', icon: '📊' },
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
  const [showOcrSettings, setShowOcrSettings] = useState(false)

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

  // "LaTeX Research Toolkit" -> "LaTeX Research" + accent-colored "Toolkit",
  // mirroring citation-bibtex-converter's two-tone wordmark (repos/citation-bibtex-converter).
  const nameWords = APP_NAME.split(' ')
  const nameLead = nameWords.slice(0, -1).join(' ')
  const nameAccent = nameWords[nameWords.length - 1]

  return (
    <div className="min-h-screen flex flex-col items-center pb-16">
      {/* White, borderless-at-top toolbar surface — deliberately shares its
          background with each module's own sticky action bar directly below
          (TableModule/ChartModule) so the two stack into one continuous bar
          instead of two visually separate bands. Only the bottom-most bar in
          that stack gets the border/shadow that marks where the toolbar ends
          and scrollable content begins. The app title now lives here (small,
          left-aligned) instead of in its own large banner above the bar —
          that banner was the topmost "floating" element on the page. */}
      <div
        className="flex items-center gap-3 px-4 py-3 w-full overflow-x-auto"
        style={{ position: 'sticky', top: 0, zIndex: 40, background: 'white', scrollbarWidth: 'none' }}
      >
        <div
          className="flex items-center gap-1.5 shrink-0 mr-1"
          title="Citation・Table・Figure・Chart を1つに統合した論文執筆支援ツール"
        >
          <span style={{ fontSize: '1.35rem' }}>📄</span>
          <span className="font-extrabold tracking-tight whitespace-nowrap" style={{ fontSize: '1.05rem', color: '#111827' }}>
            {nameLead} <span style={{ color: '#6C63FF' }}>{nameAccent}</span>
          </span>
        </div>

        <div className="flex-1 flex justify-center shrink-0">
          <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowOcrSettings(true)}
            title="画像からの読み取り（OCR）で使うVision AIのAPIキーを設定します。Citation・Table・Chartのどのタブからでもここで設定できます。"
            className="text-base font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            style={{ background: '#F0EFFE', color: '#6C63FF', border: '1px solid #DDD6FE' }}
          >
            ⚙️ APIキー
          </button>
          <button
            onClick={handleExportPaperAssets}
            disabled={exporting}
            title="Citation Library・Tableの表・Chartの図をまとめて1つのZIPファイルとしてダウンロードします"
            className="text-base font-bold px-5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-accent hover:border-accent disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {exporting ? '書き出し中...' : '📦 まとめてダウンロード'}
          </button>
        </div>
      </div>
      {showOcrSettings && <OcrSettings onClose={() => setShowOcrSettings(false)} />}

      <main className="w-full">
        <Suspense fallback={<div className="text-center text-sm text-[#6B7280] py-16">読み込み中...</div>}>
          {mountedTabs.has('citation') && (
            <div style={{ display: activeTab === 'citation' ? 'block' : 'none' }}>
              <ModuleErrorBoundary moduleName="Citation"><CitationModule /></ModuleErrorBoundary>
            </div>
          )}
          {mountedTabs.has('table') && (
            <div style={{ display: activeTab === 'table' ? 'block' : 'none' }}>
              <ModuleErrorBoundary moduleName="Table"><TableModule /></ModuleErrorBoundary>
            </div>
          )}
          {mountedTabs.has('figure') && (
            <div style={{ display: activeTab === 'figure' ? 'block' : 'none' }}>
              <ModuleErrorBoundary moduleName="Figure Converter"><FigureConvertModule /></ModuleErrorBoundary>
            </div>
          )}
          {mountedTabs.has('chart') && (
            <div style={{ display: activeTab === 'chart' ? 'block' : 'none' }}>
              <ModuleErrorBoundary moduleName="Chart"><ChartModule /></ModuleErrorBoundary>
            </div>
          )}
        </Suspense>
      </main>

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  )
}
