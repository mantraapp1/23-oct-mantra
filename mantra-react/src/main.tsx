import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { DialogProvider } from '@/contexts/DialogContext'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import './index.css'
import QueryProvider from '@/providers/QueryProvider'
import App from './App.tsx'
import { unregisterAllServiceWorkers } from '@/utils/cacheUtils'

// Unregister any existing service workers to prevent cache poisoning
unregisterAllServiceWorkers().catch(console.error);

// Create a single instance of the Supabase client
// suppressed via global handler in main.tsx if needed
// but we add it here for cleaner stack traces if possible? No, main.tsx is better.

// GLOBAL ERROR SUPPRESSION
// Suppress benign "AbortError" (mostly from React Strict Mode + Supabase internals)
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.name === 'AbortError' ||
    event.reason?.message?.includes('AbortError') ||
    event.reason?.message?.includes('signal is aborted without reason')
  ) {
    event.preventDefault(); // Prevents "Uncaught (in promise)" red error
  }
});

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
              <ToastProvider>
                <DialogProvider>
                  <AuthProvider>
                    <Suspense fallback={<GlobalLoader />}>
                      <App />
                    </Suspense>
                  </AuthProvider>
                </DialogProvider>
              </ToastProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

