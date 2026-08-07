import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { markBootStage } from './bootDiagnostics'
import './index.css'
import App from './App.tsx'

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
