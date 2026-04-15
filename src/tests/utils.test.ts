import { describe, it, expect, beforeEach } from 'vitest'
import { formatDate, slugify, getOrCreateRespondentId, statusBadgeClass } from '@/lib/utils'
import { participationColor, circleRadius, NOM_TO_CODE, COMMUNE_DATA } from '@/data/communeStats'

// ── lib/utils ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    const result = formatDate('2026-01-15T00:00:00Z')
    expect(result).toContain('2026')
    expect(result).toContain('15')
  })
})

describe('slugify', () => {
  it('convertit les espaces en tirets', () => {
    expect(slugify('Pointe-à-Pitre')).toBe('pointe-a-pitre')
  })
  it('supprime les accents', () => {
    expect(slugify('Éducation nationale')).toBe('education-nationale')
  })
  it('supprime les caractères spéciaux et normalise les espaces', () => {
    // L'apostrophe, !, ? et û sont supprimés ; les espaces consécutifs sont réduits en un seul tiret
    expect(slugify("L'eau potable ! est-elle sûre ?")).toBe('leau-potable-est-elle-sure')
  })
  it('renvoie une chaîne vide pour une entrée vide', () => {
    expect(slugify('')).toBe('')
  })
})

describe('statusBadgeClass', () => {
  it('retourne la bonne classe pour ouvert', () => {
    expect(statusBadgeClass('ouvert')).toContain('red')
  })
  it('retourne la bonne classe pour résolu', () => {
    expect(statusBadgeClass('résolu')).toContain('green')
  })
  it('retourne la classe par défaut pour un statut inconnu', () => {
    expect(statusBadgeClass('inconnu')).toContain('gray')
  })
})

describe('getOrCreateRespondentId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('crée un UUID au premier appel', () => {
    const id = getOrCreateRespondentId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })
  it('retourne le même ID au second appel', () => {
    const id1 = getOrCreateRespondentId()
    const id2 = getOrCreateRespondentId()
    expect(id1).toBe(id2)
  })
  it('génère un nouvel ID si localStorage est vidé', () => {
    const id1 = getOrCreateRespondentId()
    localStorage.clear()
    const id2 = getOrCreateRespondentId()
    expect(id1).not.toBe(id2)
  })
})

// ── data/communeStats ────────────────────────────────────────────────────────

describe('participationColor', () => {
  it('retourne gris pour 0 répondants', () => {
    expect(participationColor(0, 100)).toBe('#6b7280')
  })
  it('retourne vert vif pour forte participation (≥ 30% du max)', () => {
    expect(participationColor(30, 100)).toBe('#22c55e')
    expect(participationColor(100, 100)).toBe('#22c55e')
  })
  it('retourne orange pour participation modérée (< 30% du max)', () => {
    expect(participationColor(10, 100)).toBe('#f59e0b')
  })
  it('retourne vert si maxCount est 0 mais count > 0', () => {
    expect(participationColor(5, 0)).toBe('#34d399')
  })
})

describe('circleRadius', () => {
  it('retourne 3 pour 0 répondants', () => {
    expect(circleRadius(0, 100)).toBe(3)
  })
  it('retourne 8 pour 1 répondant sur un max de 0', () => {
    expect(circleRadius(1, 0)).toBe(8)
  })
  it('retourne 32 pour le maximum', () => {
    expect(circleRadius(100, 100)).toBe(32)
  })
  it('retourne une valeur intermédiaire proportionnelle', () => {
    const r = circleRadius(50, 100)
    expect(r).toBeGreaterThan(8)
    expect(r).toBeLessThan(32)
  })
})

describe('NOM_TO_CODE', () => {
  it('contient 34 communes', () => {
    expect(Object.keys(NOM_TO_CODE).length).toBe(34)
  })
  it('mappe Pointe-à-Pitre vers 97120', () => {
    expect(NOM_TO_CODE['Pointe-à-Pitre']).toBe('97120')
  })
  it('mappe Les Abymes vers 97101', () => {
    expect(NOM_TO_CODE['Les Abymes']).toBe('97101')
  })
  it('tous les codes INSEE pointent vers une entrée COMMUNE_DATA valide', () => {
    for (const code of Object.values(NOM_TO_CODE)) {
      expect(COMMUNE_DATA[code]).toBeDefined()
    }
  })
})

describe('COMMUNE_DATA', () => {
  it('contient 34 communes', () => {
    expect(Object.keys(COMMUNE_DATA).length).toBe(34)
  })
  it('tous les codes commencent par 971', () => {
    for (const code of Object.keys(COMMUNE_DATA)) {
      expect(code.startsWith('971')).toBe(true)
    }
  })
  it('le displayName correspond exactement au NOM_TO_CODE inverse', () => {
    for (const [name, code] of Object.entries(NOM_TO_CODE)) {
      expect(COMMUNE_DATA[code].displayName).toBe(name)
    }
  })
})
