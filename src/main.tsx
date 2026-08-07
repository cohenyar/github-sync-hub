import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { markBootStage } from './bootDiagnostics'
import './index.css'
import App from './App.tsx'
import { initErrorReporting } from './errorReporting/sentryClient'
import { registerServiceWorker } from './pwa/registerServiceWorker'

// Armed before the first render, so it can catch even an error during
// React's own initial mount. A no-op outside production or with no DSN set
// (see sentryClient.ts) — safe to always call.
initErrorReporting()
registerServiceWorker()

markBootStage('entry-module-executing')

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Meridian root element is missing')
}

const root = createRoot(rootElement)
markBootStage('react-root-created')

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
markBootStage('render-called')
