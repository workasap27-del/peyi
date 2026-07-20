import { useNavigate } from 'react-router-dom'
import { exportAllData, wipeAllData } from '../db/db'
import { useConfirmedProfile } from '../lib/hooks'
import { ACTIVITY_LABELS } from '../types'
import { formatDateFR } from '../lib/date'
import { Button, Card } from '../components/ui/Field'
import { InstallButton } from '../components/layout/InstallButton'

export function SettingsPage() {
  const profile = useConfirmedProfile()
  const navigate = useNavigate()

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poids-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleReset() {
    if (!confirm('Supprimer toutes les données locales (profil et journal) ? Cette action est irréversible.')) return
    await wipeAllData()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-10">
      <h1 className="text-xl font-bold text-slate-50">Réglages</h1>

      {profile && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-slate-200">Profil</p>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm text-slate-400">
            <dt>Taille</dt>
            <dd className="text-right text-slate-200">{profile.heightCm} cm</dd>
            <dt>Poids de départ</dt>
            <dd className="text-right text-slate-200">{profile.startWeightKg} kg</dd>
            <dt>Poids cible</dt>
            <dd className="text-right text-slate-200">{profile.targetWeightKg} kg</dd>
            <dt>Âge</dt>
            <dd className="text-right text-slate-200">{profile.age} ans</dd>
            <dt>Niveau d'activité</dt>
            <dd className="text-right text-slate-200">{ACTIVITY_LABELS[profile.activityLevel]}</dd>
            <dt>Déficit visé</dt>
            <dd className="text-right text-slate-200">{profile.dailyDeficitTarget} kcal/j</dd>
            <dt>Début</dt>
            <dd className="text-right text-slate-200">{formatDateFR(profile.startDate)}</dd>
          </dl>
        </Card>
      )}

      <Card>
        <p className="mb-1 text-sm font-semibold text-slate-200">Tes données t'appartiennent</p>
        <p className="mb-3 text-xs text-slate-500">
          Toutes les données restent stockées localement sur cet appareil (IndexedDB). Aucun serveur, aucun compte.
        </p>
        <Button variant="secondary" onClick={handleExport} className="w-full">
          ⬇️ Exporter mes données (JSON)
        </Button>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-200">Application</p>
        <InstallButton />
      </Card>

      <Card className="border-rose-900/50">
        <p className="mb-2 text-sm font-semibold text-rose-300">Zone de danger</p>
        <Button variant="secondary" onClick={handleReset} className="w-full border-rose-900/50 text-rose-300 hover:bg-rose-950/40">
          Réinitialiser toutes les données
        </Button>
      </Card>
    </div>
  )
}
