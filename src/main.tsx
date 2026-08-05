import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initErrorReporting } from './errorReporting/sentryClient'
import { registerServiceWorker } from './pwa/registerServiceWorker'

// Armed before the first render, so it can catch even an error during
// React's own initial mount. A no-op outside production or with no DSN set
// (see sentryClient.ts) — safe to always call.
initErrorReporting()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
