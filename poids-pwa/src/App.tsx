import { Navigate, Route, Routes } from 'react-router-dom'
import { useProfile } from './lib/hooks'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { JournalPage } from './pages/JournalPage'
import { SettingsPage } from './pages/SettingsPage'
import { BottomNav } from './components/layout/BottomNav'

export default function App() {
  const profile = useProfile()

  if (profile === 'loading') {
    return <div className="min-h-screen bg-slate-950" />
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <OnboardingPage />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <main className="flex-1 pb-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
