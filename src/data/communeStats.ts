export interface CommuneStat {
  code: string          // INSEE 97xxx
  displayName: string   // nom affiché (avec article)
  participantCount: number
  activeSurveyCount: number
}

// Mapping code INSEE → nom affiché
export const COMMUNE_DATA: Record<string, { displayName: string }> = {
  '97101': { displayName: 'Les Abymes' },
  '97102': { displayName: 'Anse-Bertrand' },
  '97103': { displayName: 'Baie-Mahault' },
  '97104': { displayName: 'Baillif' },
  '97105': { displayName: 'Basse-Terre' },
  '97106': { displayName: 'Bouillante' },
  '97107': { displayName: 'Capesterre-Belle-Eau' },
  '97108': { displayName: 'Capesterre-de-MG' },
  '97109': { displayName: 'Gourbeyre' },
  '97110': { displayName: 'La Désirade' },
  '97111': { displayName: 'Deshaies' },
  '97112': { displayName: 'Grand-Bourg' },
  '97113': { displayName: 'Le Gosier' },
  '97114': { displayName: 'Goyave' },
  '97115': { displayName: 'Le Lamentin' },
  '97116': { displayName: "Morne-à-l'Eau" },
  '97117': { displayName: 'Le Moule' },
  '97118': { displayName: 'Petit-Bourg' },
  '97119': { displayName: 'Petit-Canal' },
  '97120': { displayName: 'Pointe-à-Pitre' },
  '97121': { displayName: 'Pointe-Noire' },
  '97122': { displayName: 'Port-Louis' },
  '97124': { displayName: 'Saint-Claude' },
  '97125': { displayName: 'Saint-François' },
  '97126': { displayName: 'Saint-Louis (MG)' },
  '97128': { displayName: 'Sainte-Anne' },
  '97129': { displayName: 'Sainte-Rose' },
  '97130': { displayName: 'Terre-de-Bas' },
  '97131': { displayName: 'Terre-de-Haut' },
  '97132': { displayName: 'Trois-Rivières' },
  '97133': { displayName: 'Vieux-Fort' },
  '97134': { displayName: 'Vieux-Habitants' },
  '97127': { displayName: 'Saint-Martin' },
  '97123': { displayName: 'Saint-Barthélemy' },
}

// Mapping noms → code INSEE (pour matcher les demographics Supabase)
export const NOM_TO_CODE: Record<string, string> = {
  'Pointe-à-Pitre':       '97120',
  'Basse-Terre':          '97105',
  'Les Abymes':           '97101',
  'Capesterre-Belle-Eau': '97107',
  'Saint-François':       '97125',
  'Baie-Mahault':         '97103',
  'Le Gosier':            '97113',
}

/**
 * Couleur du rond selon les répondants RÉELS.
 * Gris si zéro répondant, orange entre 1-99, vert si 100+.
 */
export function participationColor(count: number): string {
  if (count >= 100) return '#22c55e'
  if (count >= 1)   return '#f59e0b'
  return '#6b7280'
}

/** Alias conservé pour compatibilité */
export function heatColor(count: number): string {
  return participationColor(count)
}

/**
 * Rayon du cercle en pixels selon le nb de répondants.
 * 0 → 3px (petit gris fixe), sinon proportionnel entre 8 et 32.
 */
export function circleRadius(count: number, maxCount: number): number {
  if (count === 0) return 3
  const ratio = maxCount > 0 ? count / maxCount : 0
  return 8 + ratio * 24 // 8px min → 32px max
}
