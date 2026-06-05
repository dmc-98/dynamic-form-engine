import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
)
