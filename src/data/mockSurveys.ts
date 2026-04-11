import type { Survey, SurveyResponse } from '@/types'

export const mockSurveys: Survey[] = [
  {
    id: 'survey-1',
    title: 'Qualité de l\'eau potable dans votre commune',
    description: 'Aidez-nous à dresser un état des lieux de l\'accès à l\'eau potable en Guadeloupe. Vos réponses sont anonymes.',
    commune_id: null,
    questions: [
      {
        id: 'q1',
        type: 'single',
        label: 'Comment évaluez-vous la qualité de l\'eau du robinet chez vous ?',
        options: ['Excellente', 'Bonne', 'Moyenne', 'Mauvaise', 'Très mauvaise'],
        required: true,
      },
      {
        id: 'q2',
        type: 'single',
        label: 'Avez-vous subi des coupures d\'eau ces 3 derniers mois ?',
        options: ['Non, aucune', 'Oui, 1 à 2 fois', 'Oui, 3 à 5 fois', 'Oui, plus de 5 fois'],
        required: true,
      },
      {
        id: 'q3',
        type: 'multiple',
        label: 'Quels problèmes avez-vous constatés ? (plusieurs réponses possibles)',
        options: ['Eau trouble ou colorée', 'Mauvaise odeur', 'Goût de chlore prononcé', 'Pression insuffisante', 'Aucun problème'],
      },
      {
        id: 'q4',
        type: 'single',
        label: 'Achetez-vous de l\'eau en bouteille régulièrement ?',
        options: ['Non', 'Parfois', 'Souvent', 'Toujours'],
        required: true,
      },
      {
        id: 'q5',
        type: 'scale',
        label: 'Sur 10, notez votre satisfaction globale concernant la gestion de l\'eau par les autorités',
        required: true,
      },
    ],
    is_active: true,
    ends_at: '2026-06-30T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'survey-2',
    title: 'Mobilité et transports en commun',
    description: 'Dites-nous comment vous vous déplacez au quotidien et ce que vous attendez des transports en Guadeloupe.',
    commune_id: null,
    questions: [
      {
        id: 'q1',
        type: 'single',
        label: 'Quel est votre principal moyen de transport au quotidien ?',
        options: ['Voiture personnelle', 'Bus / Transport en commun', 'Moto / Scooter', 'Vélo', 'À pied'],
        required: true,
      },
      {
        id: 'q2',
        type: 'single',
        label: 'Utilisez-vous les transports en commun (bus CGTG, Karulis…) ?',
        options: ['Tous les jours', 'Plusieurs fois par semaine', 'Rarement', 'Jamais'],
        required: true,
      },
      {
        id: 'q3',
        type: 'multiple',
        label: 'Pourquoi n\'utilisez-vous pas plus les transports en commun ?',
        options: [
          'Horaires insuffisants',
          'Lignes ne correspondent pas à mes trajets',
          'Manque de confort',
          'Prix trop élevé',
          'Je les utilise déjà régulièrement',
        ],
      },
      {
        id: 'q4',
        type: 'scale',
        label: 'Sur 10, notez la qualité du réseau de transport en commun actuel',
        required: true,
      },
      {
        id: 'q5',
        type: 'single',
        label: 'Seriez-vous prêt à utiliser un tramway ou RER guadeloupéen s\'il était créé ?',
        options: ['Oui, absolument', 'Probablement', 'Peu probable', 'Non'],
        required: true,
      },
    ],
    is_active: true,
    ends_at: '2026-05-31T00:00:00Z',
    created_at: '2026-03-15T00:00:00Z',
  },
  {
    id: 'survey-3',
    title: 'Vie nocturne et culture à Pointe-à-Pitre',
    description: 'Votre avis sur l\'offre culturelle et les sorties dans la métropole guadeloupéenne.',
    commune_id: 'commune-pap',
    commune: { id: 'commune-pap', name: 'Pointe-à-Pitre', code_insee: '97120', department: '971', lat: 16.241, lng: -61.533 },
    questions: [
      {
        id: 'q1',
        type: 'single',
        label: 'À quelle fréquence sortez-vous le soir à Pointe-à-Pitre ?',
        options: ['Toutes les semaines', '2 à 3 fois par mois', 'Moins d\'une fois par mois', 'Jamais'],
        required: true,
      },
      {
        id: 'q2',
        type: 'multiple',
        label: 'Quels types de sorties vous intéressent le plus ?',
        options: ['Concerts / Gwoka / Zouk', 'Restaurants', 'Expositions / Musées', 'Bars / Terrasses', 'Théâtre / Spectacles', 'Carnaval / Fêtes locales'],
        required: true,
      },
      {
        id: 'q3',
        type: 'single',
        label: 'L\'offre culturelle actuelle répond-elle à vos attentes ?',
        options: ['Très bien', 'Plutôt bien', 'Insuffisamment', 'Pas du tout'],
        required: true,
      },
      {
        id: 'q4',
        type: 'text',
        label: 'Quel événement culturel manque selon vous à Pointe-à-Pitre ?',
      },
    ],
    is_active: true,
    ends_at: null,
    created_at: '2026-04-01T00:00:00Z',
  },
]

// Réponses simulées pour démonstration des résultats
export const mockResponses: SurveyResponse[] = [
  // Survey 1 — Eau
  ...Array.from({ length: 120 }, (_, i) => ({
    id: `r1-${i}`,
    survey_id: 'survey-1',
    respondent_id: `anon-${i}`,
    answers: {
      q1: ['Bonne', 'Moyenne', 'Mauvaise', 'Moyenne', 'Très mauvaise', 'Bonne'][i % 6],
      q2: ['Non, aucune', 'Oui, 1 à 2 fois', 'Oui, 3 à 5 fois', 'Oui, 1 à 2 fois'][i % 4],
      q3: i % 3 === 0 ? ['Eau trouble ou colorée', 'Mauvaise odeur'] : ['Goût de chlore prononcé'],
      q4: ['Souvent', 'Toujours', 'Parfois', 'Toujours'][i % 4],
      q5: [3, 4, 5, 4, 6, 3, 5, 4][i % 8],
    },
    demographics: {
      age_group: (['15-24', '25-34', '35-49', '50-64', '65+'] as const)[i % 5],
      commune: (['Pointe-à-Pitre', 'Basse-Terre', 'Les Abymes', 'Capesterre-Belle-Eau', 'Saint-François'] as const)[i % 5],
      gender: (['homme', 'femme', 'femme', 'homme'] as const)[i % 4],
    },
    created_at: new Date(2026, 2, i + 1).toISOString(),
  })),

  // Survey 2 — Mobilité
  ...Array.from({ length: 85 }, (_, i) => ({
    id: `r2-${i}`,
    survey_id: 'survey-2',
    respondent_id: `anon-mob-${i}`,
    answers: {
      q1: ['Voiture personnelle', 'Voiture personnelle', 'Bus / Transport en commun', 'Moto / Scooter', 'Voiture personnelle'][i % 5],
      q2: ['Jamais', 'Rarement', 'Rarement', 'Plusieurs fois par semaine', 'Jamais'][i % 5],
      q3: ['Horaires insuffisants', 'Lignes ne correspondent pas à mes trajets'],
      q4: [2, 3, 3, 4, 2, 3][i % 6],
      q5: ['Probablement', 'Oui, absolument', 'Peu probable', 'Oui, absolument'][i % 4],
    },
    demographics: {
      age_group: (['25-34', '35-49', '25-34', '50-64', '15-24'] as const)[i % 5],
      commune: (['Les Abymes', 'Baie-Mahault', 'Pointe-à-Pitre', 'Le Gosier'] as const)[i % 4],
      gender: (['homme', 'femme'] as const)[i % 2],
    },
    created_at: new Date(2026, 3, i + 1).toISOString(),
  })),

  // Survey 3 — Culture PAP
  ...Array.from({ length: 47 }, (_, i) => ({
    id: `r3-${i}`,
    survey_id: 'survey-3',
    respondent_id: `anon-cult-${i}`,
    answers: {
      q1: ['2 à 3 fois par mois', 'Toutes les semaines', 'Moins d\'une fois par mois', '2 à 3 fois par mois'][i % 4],
      q2: i % 2 === 0 ? ['Concerts / Gwoka / Zouk', 'Bars / Terrasses'] : ['Carnaval / Fêtes locales', 'Restaurants'],
      q3: ['Insuffisamment', 'Plutôt bien', 'Insuffisamment', 'Pas du tout'][i % 4],
      q4: '',
    },
    demographics: {
      age_group: (['15-24', '25-34', '25-34', '35-49'] as const)[i % 4],
      commune: 'Pointe-à-Pitre',
      gender: (['femme', 'homme', 'femme'] as const)[i % 3],
    },
    created_at: new Date(2026, 3, i + 1).toISOString(),
  })),
]
