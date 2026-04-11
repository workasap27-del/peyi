import { mockResponses } from './mockSurveys'

export interface CommuneStat {
  code: string          // INSEE 97xxx
  nom: string           // nom officiel GeoJSON
  displayName: string   // nom affiché (avec article)
  participantCount: number
  opinionScore: number  // 0 = calme → 1 = critique
  heatScore: number
  topTopic: string
}

// Mapping code INSEE → données métier
// noms exacts du GeoJSON (champ `nom`)
export const COMMUNE_DATA: Record<string, {
  displayName: string
  opinionScore: number
  topTopic: string
  extraCount?: number   // répondants fictifs en plus des mock
}> = {
  '97101': { displayName: 'Les Abymes',              opinionScore: 0.60, topTopic: 'sécurité & logement',   extraCount: 55 },
  '97102': { displayName: 'Anse-Bertrand',           opinionScore: 0.45, topTopic: 'agriculture',            extraCount: 8  },
  '97103': { displayName: 'Baie-Mahault',            opinionScore: 0.40, topTopic: 'emploi & zone indus.',   extraCount: 32 },
  '97104': { displayName: 'Baillif',                 opinionScore: 0.38, topTopic: 'voirie',                 extraCount: 6  },
  '97105': { displayName: 'Basse-Terre',             opinionScore: 0.55, topTopic: 'politique & services',   extraCount: 35 },
  '97106': { displayName: 'Bouillante',              opinionScore: 0.35, topTopic: 'énergie géothermale',    extraCount: 7  },
  '97107': { displayName: 'Capesterre-Belle-Eau',    opinionScore: 0.80, topTopic: 'eau & routes',           extraCount: 22 },
  '97108': { displayName: 'Capesterre-de-MG',        opinionScore: 0.55, topTopic: 'desserte maritime',      extraCount: 9  },
  '97109': { displayName: 'Gourbeyre',               opinionScore: 0.42, topTopic: 'aménagement',           extraCount: 10 },
  '97110': { displayName: 'La Désirade',             opinionScore: 0.50, topTopic: 'désenclavement',         extraCount: 5  },
  '97111': { displayName: 'Deshaies',                opinionScore: 0.30, topTopic: 'tourisme',               extraCount: 6  },
  '97112': { displayName: 'Grand-Bourg',             opinionScore: 0.60, topTopic: 'desserte maritime',      extraCount: 11 },
  '97113': { displayName: 'Le Gosier',               opinionScore: 0.55, topTopic: 'tourisme & littoral',    extraCount: 28 },
  '97114': { displayName: 'Goyave',                  opinionScore: 0.48, topTopic: 'inondations',            extraCount: 9  },
  '97115': { displayName: 'Le Lamentin',             opinionScore: 0.50, topTopic: 'zones industrielles',    extraCount: 19 },
  '97116': { displayName: 'Morne-à-l\'Eau',          opinionScore: 0.70, topTopic: 'eau potable',            extraCount: 15 },
  '97117': { displayName: 'Le Moule',                opinionScore: 0.65, topTopic: 'logement & eau',         extraCount: 22 },
  '97118': { displayName: 'Petit-Bourg',             opinionScore: 0.60, topTopic: 'route & transport',      extraCount: 17 },
  '97119': { displayName: 'Petit-Canal',             opinionScore: 0.44, topTopic: 'agriculture',            extraCount: 7  },
  '97120': { displayName: 'Pointe-à-Pitre',          opinionScore: 0.75, topTopic: 'eau & transport',        extraCount: 0  },
  '97121': { displayName: 'Pointe-Noire',            opinionScore: 0.45, topTopic: 'pêche artisanale',       extraCount: 6  },
  '97122': { displayName: 'Port-Louis',              opinionScore: 0.35, topTopic: 'pêche',                  extraCount: 10 },
  '97124': { displayName: 'Saint-Claude',            opinionScore: 0.40, topTopic: 'volcan & tourisme',      extraCount: 14 },
  '97125': { displayName: 'Saint-François',          opinionScore: 0.25, topTopic: 'littoral & golf',        extraCount: 12 },
  '97126': { displayName: 'Saint-Louis (MG)',        opinionScore: 0.52, topTopic: 'transport insulaire',    extraCount: 8  },
  '97128': { displayName: 'Sainte-Anne',             opinionScore: 0.30, topTopic: 'environnement',          extraCount: 18 },
  '97129': { displayName: 'Sainte-Rose',             opinionScore: 0.50, topTopic: 'déchets & mangrove',     extraCount: 20 },
  '97130': { displayName: 'Terre-de-Bas',            opinionScore: 0.42, topTopic: 'desserte & eau',         extraCount: 4  },
  '97131': { displayName: 'Terre-de-Haut',           opinionScore: 0.28, topTopic: 'tourisme durable',       extraCount: 5  },
  '97132': { displayName: 'Trois-Rivières',          opinionScore: 0.70, topTopic: 'voirie & eau',           extraCount: 9  },
  '97133': { displayName: 'Vieux-Fort',              opinionScore: 0.38, topTopic: 'érosion côtière',        extraCount: 5  },
  '97134': { displayName: 'Vieux-Habitants',         opinionScore: 0.42, topTopic: 'agriculture & café',     extraCount: 7  },
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

function computeStats(): CommuneStat[] {
  // Compter les réponses mock par commune
  const counts: Record<string, number> = {}
  for (const r of mockResponses) {
    const c = r.demographics.commune
    if (c) {
      const code = NOM_TO_CODE[c]
      if (code) counts[code] = (counts[code] ?? 0) + 1
    }
  }

  const stats: CommuneStat[] = Object.entries(COMMUNE_DATA).map(([code, d]) => {
    const fromMock = counts[code] ?? 0
    const participantCount = fromMock + (d.extraCount ?? 0)
    return {
      code,
      nom: code, // sera remplacé depuis le GeoJSON
      displayName: d.displayName,
      participantCount,
      opinionScore: d.opinionScore,
      heatScore: 0, // calculé après
      topTopic: d.topTopic,
    }
  })

  const maxCount = Math.max(...stats.map(s => s.participantCount), 1)
  for (const s of stats) {
    const normalizedCount = s.participantCount / maxCount
    s.heatScore = normalizedCount * 0.45 + s.opinionScore * 0.55
  }

  return stats
}

export const communeStats: CommuneStat[] = computeStats()

// Index par code INSEE pour lookup O(1)
export const statsByCode = Object.fromEntries(
  communeStats.map(s => [s.code, s])
)

/** Convertit un heatScore [0-1] en couleur hex */
export function heatColor(score: number): string {
  if (score < 0.4) return lerpColor('#22c55e', '#f59e0b', score / 0.4)
  return lerpColor('#f59e0b', '#dc2626', (score - 0.4) / 0.6)
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16)
  const r = Math.round(parse(a,1) + (parse(b,1) - parse(a,1)) * t).toString(16).padStart(2,'0')
  const g = Math.round(parse(a,3) + (parse(b,3) - parse(a,3)) * t).toString(16).padStart(2,'0')
  const bl = Math.round(parse(a,5) + (parse(b,5) - parse(a,5)) * t).toString(16).padStart(2,'0')
  return `#${r}${g}${bl}`
}
