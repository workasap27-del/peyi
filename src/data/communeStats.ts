export interface CommuneStat {
  code: string          // INSEE 97xxx
  displayName: string   // nom affiché (avec article)
  participantCount: number
  activeSurveyCount: number
}

// Mapping code INSEE → données métier
// noms exacts du GeoJSON (champ `nom`)
export const COMMUNE_DATA: Record<string, {
  displayName: string
  extraCount?: number   // répondants fictifs de base
}> = {
  '97101': { displayName: 'Les Abymes',              extraCount: 55 },
  '97102': { displayName: 'Anse-Bertrand',           extraCount: 8  },
  '97103': { displayName: 'Baie-Mahault',            extraCount: 32 },
  '97104': { displayName: 'Baillif',                 extraCount: 6  },
  '97105': { displayName: 'Basse-Terre',             extraCount: 35 },
  '97106': { displayName: 'Bouillante',              extraCount: 7  },
  '97107': { displayName: 'Capesterre-Belle-Eau',    extraCount: 22 },
  '97108': { displayName: 'Capesterre-de-MG',        extraCount: 9  },
  '97109': { displayName: 'Gourbeyre',               extraCount: 10 },
  '97110': { displayName: 'La Désirade',             extraCount: 5  },
  '97111': { displayName: 'Deshaies',                extraCount: 6  },
  '97112': { displayName: 'Grand-Bourg',             extraCount: 11 },
  '97113': { displayName: 'Le Gosier',               extraCount: 28 },
  '97114': { displayName: 'Goyave',                  extraCount: 9  },
  '97115': { displayName: 'Le Lamentin',             extraCount: 19 },
  '97116': { displayName: 'Morne-à-l\'Eau',          extraCount: 15 },
  '97117': { displayName: 'Le Moule',                extraCount: 22 },
  '97118': { displayName: 'Petit-Bourg',             extraCount: 17 },
  '97119': { displayName: 'Petit-Canal',             extraCount: 7  },
  '97120': { displayName: 'Pointe-à-Pitre',          extraCount: 0  },
  '97121': { displayName: 'Pointe-Noire',            extraCount: 6  },
  '97122': { displayName: 'Port-Louis',              extraCount: 10 },
  '97124': { displayName: 'Saint-Claude',            extraCount: 14 },
  '97125': { displayName: 'Saint-François',          extraCount: 12 },
  '97126': { displayName: 'Saint-Louis (MG)',        extraCount: 8  },
  '97128': { displayName: 'Sainte-Anne',             extraCount: 18 },
  '97129': { displayName: 'Sainte-Rose',             extraCount: 20 },
  '97130': { displayName: 'Terre-de-Bas',            extraCount: 4  },
  '97131': { displayName: 'Terre-de-Haut',           extraCount: 5  },
  '97132': { displayName: 'Trois-Rivières',          extraCount: 9  },
  '97133': { displayName: 'Vieux-Fort',              extraCount: 5  },
  '97134': { displayName: 'Vieux-Habitants',         extraCount: 7  },
}

// Mapping noms mock → code INSEE
export const NOM_TO_CODE: Record<string, string> = {
  'Pointe-à-Pitre':       '97120',
  'Basse-Terre':          '97105',
  'Les Abymes':           '97101',
  'Capesterre-Belle-Eau': '97107',
  'Saint-François':       '97125',
  'Baie-Mahault':         '97103',
  'Le Gosier':            '97113',
}

/** Retourne une couleur hex selon le nombre de répondants */
export function participationColor(count: number): string {
  if (count >= 100) return '#22c55e'
  if (count >= 20) return '#f59e0b'
  return '#6b7280'
}

/** Alias conservé pour compatibilité (utilise participationColor) */
export function heatColor(count: number): string {
  return participationColor(count)
}
