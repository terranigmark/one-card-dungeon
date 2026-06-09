import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Side-effect imports: apply persisted appearance tweaks and the resolved
// language to <html> at startup, before the first render.
import './state/themeStore'
import './i18n/store'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
