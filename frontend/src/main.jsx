import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/classic-theme.css'
import App from './App.jsx'

registerSW({ immediate: true })

document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light'
const savedUITheme = localStorage.getItem('uiTheme')
if (savedUITheme && savedUITheme !== 'modern') document.documentElement.dataset.uiTheme = savedUITheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
