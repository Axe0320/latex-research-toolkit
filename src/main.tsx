import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

// DSN belongs to a Sentry project created for this integrated app, separate
// from figure-modification's own project (see docs/03-tech-alignment.md) —
// the old standalone deployments stay live and must not share error telemetry
// with this one. Unset in local dev, so Sentry no-ops until Phase 8 sets it.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
