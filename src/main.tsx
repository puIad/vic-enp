import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import { App } from './App'
import { keepOrphans } from './lib/orphans'
import { session } from './scroll/restore'
import './index.css'

// the scroll engine puts a reload back in the right act and step itself (scroll/restore.ts); the browser's own restore
// lands by pixel on a page that is still growing. Without sessionStorage the browser's restore is the better guess.
if (session()) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

keepOrphans()
