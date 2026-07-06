import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'

interface ModuleErrorBoundaryProps {
  moduleName: string
  children: ReactNode
}

// Wraps a single tab's module so an uncaught render error there doesn't take
// down the other 3 tabs — they all stay mounted simultaneously (App.tsx keeps
// visited tabs alive via display:none rather than unmounting), so without a
// per-module boundary a crash in one would unmount the whole React root.
export default function ModuleErrorBoundary({ moduleName, children }: ModuleErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--error, #EF4444)' }}>
            {moduleName} でエラーが発生しました
          </p>
          <p className="text-sm text-[#6B7280]">
            他のタブは引き続き利用できます。このタブを再読み込みしてください。
          </p>
          <button
            onClick={resetError}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-accent hover:border-accent transition-colors"
          >
            再読み込み
          </button>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
