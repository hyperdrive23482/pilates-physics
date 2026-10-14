import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { captureAttribution } from './lib/attribution'

// Before React, once per document: records how this visit arrived (referrer
// host, UTMs, landing path) in localStorage. See src/lib/attribution.js.
captureAttribution()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
