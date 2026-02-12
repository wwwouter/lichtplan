import './webApi'
import '../../src/renderer/src/assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../../src/renderer/src/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
