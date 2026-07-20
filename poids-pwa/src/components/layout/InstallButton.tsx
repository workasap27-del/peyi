import { useEffect, useState } from 'react'
import { Button } from '../ui/Field'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }
    if (isIOS()) {
      setShowIOSHint(true)
      return
    }
  }

  if (!deferredPrompt && !isIOS()) return null

  return (
    <div className="relative">
      <Button variant="secondary" onClick={handleClick} className="w-full sm:w-auto">
        📲 Installer l'application
      </Button>
      {showIOSHint && (
        <p className="mt-2 max-w-xs text-xs text-slate-400">
          Sur iPhone/iPad : appuie sur le bouton{' '}
          <span className="font-semibold text-slate-200">Partager</span> de Safari, puis{' '}
          <span className="font-semibold text-slate-200">« Sur l'écran d'accueil »</span>.
        </p>
      )}
    </div>
  )
}
