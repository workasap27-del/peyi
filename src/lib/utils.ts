/**
 * Formate une date ISO en français
 * Ex : "3 avril 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formate une date relative : "il y a 2 heures", "hier", etc.
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return formatDate(iso)
}

/**
 * Génère un slug URL-safe depuis un titre
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Génère un identifiant anonyme stable (fingerprint léger)
 * Stocké dans localStorage pour la déduplication des votes
 */
export function getOrCreateRespondentId(): string {
  const key = 'peyi_respondent_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

/** Classe CSS badge selon le statut d'un signalement */
export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    ouvert: 'bg-red-100 text-red-700',
    en_cours: 'bg-yellow-100 text-yellow-700',
    résolu: 'bg-green-100 text-green-700',
    rejeté: 'bg-gray-100 text-gray-500',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}
