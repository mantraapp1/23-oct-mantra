import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import './index.css'
import QueryProvider from '@/providers/QueryProvider'
import App from './App.tsx'

// Global loading fallback
function GlobalLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryProvider>
          <BrowserRouter>
            <ThemeProvider>
              <AuthProvider>
                <Suspense fallback={<GlobalLoader />}>
                  <App />
                </Suspense>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

