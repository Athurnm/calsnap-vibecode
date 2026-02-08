import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { UsageProvider } from './contexts/UsageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UsageProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </UsageProvider>
    </AuthProvider>
  </StrictMode>,
)
