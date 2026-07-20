import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useProfile } from './lib/hooks'
import { BottomNav } from './components/layout/BottomNav'

const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const JournalPage = lazy(() => import('./pages/JournalPage').then((m) => ({ default: m.JournalPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

function PageFallback() {
  return <div className="min-h-screen bg-slate-950" />
}

export default function App() {
  const profile = useProfile()

  if (profile === 'loading') {
    return <PageFallback />
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Suspense fallback={<PageFallback />}>
          <OnboardingPage />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 pb-4">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  )
}
