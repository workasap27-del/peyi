export interface CommuneStat {
  code: string          // INSEE 97xxx
  displayName: string   // nom affiché (avec article)
  participantCount: number
  activeSurveyCount: number
}

// Mapping code INSEE → nom affiché (doit correspondre exactement aux noms du profil citoyen)
export const COMMUNE_DATA: Record<string, { displayName: string }> = {
  '97101': { displayName: 'Les Abymes' },
  '97102': { displayName: 'Anse-Bertrand' },
  '97103': { displayName: 'Baie-Mahault' },
  '97104': { displayName: 'Baillif' },
  '97105': { displayName: 'Basse-Terre' },
  '97106': { displayName: 'Bouillante' },
  '97107': { displayName: 'Capesterre-Belle-Eau' },
  '97108': { displayName: 'Capesterre-de-Marie-Galante' },
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
  '97123': { displayName: 'Saint-Barthélemy' },
  '97124': { displayName: 'Saint-Claude' },
  '97125': { displayName: 'Saint-François' },
  '97126': { displayName: 'Saint-Louis (Marie-Galante)' },
  '97127': { displayName: 'Saint-Martin' },
  '97128': { displayName: 'Sainte-Anne' },
  '97129': { displayName: 'Sainte-Rose' },
  '97130': { displayName: 'Terre-de-Bas' },
  '97131': { displayName: 'Terre-de-Haut' },
  '97132': { displayName: 'Trois-Rivières' },
  '97133': { displayName: 'Vieux-Fort' },
  '97134': { displayName: 'Vieux-Habitants' },
}

// Mapping complet nom commune → code INSEE
// Les noms doivent correspondre EXACTEMENT à ceux stockés dans demographics.commune
export const NOM_TO_CODE: Record<string, string> = {
  'Les Abymes':                     '97101',
  'Anse-Bertrand':                  '97102',
  'Baie-Mahault':                   '97103',
  'Baillif':                        '97104',
  'Basse-Terre':                    '97105',
  'Bouillante':                     '97106',
  'Capesterre-Belle-Eau':           '97107',
  'Capesterre-de-Marie-Galante':    '97108',
  'Gourbeyre':                      '97109',
  'La Désirade':                    '97110',
  'Deshaies':                       '97111',
  'Grand-Bourg':                    '97112',
  'Le Gosier':                      '97113',
  'Goyave':                         '97114',
  'Le Lamentin':                    '97115',
  "Morne-à-l'Eau":                  '97116',
  'Le Moule':                       '97117',
  'Petit-Bourg':                    '97118',
  'Petit-Canal':                    '97119',
  'Pointe-à-Pitre':                 '97120',
  'Pointe-Noire':                   '97121',
  'Port-Louis':                     '97122',
  'Saint-Barthélemy':               '97123',
  'Saint-Claude':                   '97124',
  'Saint-François':                 '97125',
  'Saint-Louis (Marie-Galante)':    '97126',
  'Saint-Martin':                   '97127',
  'Sainte-Anne':                    '97128',
  'Sainte-Rose':                    '97129',
  'Terre-de-Bas':                   '97130',
  'Terre-de-Haut':                  '97131',
  'Trois-Rivières':                 '97132',
  'Vieux-Fort':                     '97133',
  'Vieux-Habitants':                '97134',
}

/** Populations INSEE 2020 par code INSEE */
export const COMMUNE_POPULATION: Record<string, number> = {
  '97101': 58000,  // Les Abymes
  '97102': 4500,   // Anse-Bertrand
  '97103': 32000,  // Baie-Mahault
  '97104': 6000,   // Baillif
  '97105': 10000,  // Basse-Terre
  '97106': 8000,   // Bouillante
  '97107': 19000,  // Capesterre-Belle-Eau
  '97108': 4000,   // Capesterre-de-Marie-Galante
  '97109': 1700,   // La Désirade
  '97110': 27000,  // Le Gosier
  '97111': 4000,   // Deshaies
  '97112': 6000,   // Grand-Bourg
  '97113': 9000,   // Gourbeyre
  '97114': 9000,   // Goyave
  '97115': 13000,  // Le Lamentin
  '97116': 22000,  // Le Moule
  '97117': 27000,  // Le Gosier (doublon conservé pour compatibilité)
  '97118': 17000,  // Morne-à-l'Eau
  '97119': 4000,   // Petit-Canal
  '97120': 15000,  // Pointe-à-Pitre
  '97121': 7000,   // Pointe-Noire
  '97122': 6000,   // Port-Louis
  '97123': 10000,  // Saint-Barthélemy
  '97124': 10000,  // Saint-Claude
  '97125': 24000,  // Sainte-Anne
  '97126': 4000,   // Saint-Louis (Marie-Galante)
  '97127': 35000,  // Saint-Martin
  '97128': 20000,  // Sainte-Rose
  '97129': 1500,   // Terre-de-Bas
  '97130': 1700,   // Terre-de-Haut
  '97131': 8000,   // Trois-Rivières
  '97132': 1500,   // Vieux-Fort
  '97133': 8000,   // Vieux-Habitants
  '97134': 22000,  // Petit-Bourg
}

export const POPULATION_TOTALE_GUADELOUPE = 378000

/**
 * Couleur relative selon le nb de répondants et le maximum connu.
 * Vert clair si aucun répondant (communes visibles), vert vif si > 30% du max, orange sinon.
 */
export function participationColor(count: number, maxCount: number): string {
  if (count === 0) return '#6b7280'   // gris pour cercles uniquement
  if (maxCount === 0) return '#34d399'
  if (count >= maxCount * 0.3) return '#22c55e'  // vert vif : forte participation
  return '#f59e0b'                               // orange : participation modérée
}

/**
 * Label lisible pour la légende.
 */
export function getParticipationLabel(count: number, maxCount: number): string {
  if (count === 0) return 'Aucune'
  if (count >= maxCount * 0.3) return 'Forte participation'
  return 'Modérée'
}

/** Alias conservé pour compatibilité descendante */
export function heatColor(count: number, maxCount = 0): string {
  return participationColor(count, maxCount)
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
