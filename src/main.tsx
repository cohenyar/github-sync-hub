import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Meridian root element is missing')
}

// A successful module boot clears the one-time stale-preview recovery flag.
// This happens before React renders, so future genuine failures can recover.
try {
  window.sessionStorage.removeItem('meridian:boot-retry')
} catch {
  // Storage can be unavailable in strict privacy modes; rendering still works.
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
