-- Seed : 3 sondages initiaux pour Péyi
-- À exécuter dans le SQL Editor de Supabase Dashboard APRÈS communes.sql
-- survey-3 est lié à Pointe-à-Pitre (code_insee 97120)

insert into surveys (id, title, description, commune_id, questions, is_active, ends_at, created_at)
values
(
  'a0000000-0000-0000-0000-000000000001',
  'Qualité de l''eau potable dans votre commune',
  'Aidez-nous à dresser un état des lieux de l''accès à l''eau potable en Guadeloupe. Vos réponses sont anonymes.',
  null,
  '[
    {"id":"q1","type":"single","label":"Comment évaluez-vous la qualité de l''eau du robinet chez vous ?","options":["Excellente","Bonne","Moyenne","Mauvaise","Très mauvaise"],"required":true},
    {"id":"q2","type":"single","label":"Avez-vous subi des coupures d''eau ces 3 derniers mois ?","options":["Non, aucune","Oui, 1 à 2 fois","Oui, 3 à 5 fois","Oui, plus de 5 fois"],"required":true},
    {"id":"q3","type":"multiple","label":"Quels problèmes avez-vous constatés ? (plusieurs réponses possibles)","options":["Eau trouble ou colorée","Mauvaise odeur","Goût de chlore prononcé","Pression insuffisante","Aucun problème"]},
    {"id":"q4","type":"single","label":"Achetez-vous de l''eau en bouteille régulièrement ?","options":["Non","Parfois","Souvent","Toujours"],"required":true},
    {"id":"q5","type":"scale","label":"Sur 10, notez votre satisfaction globale concernant la gestion de l''eau par les autorités","required":true}
  ]'::jsonb,
  true,
  '2026-06-30T00:00:00Z',
  '2026-03-01T00:00:00Z'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Mobilité et transports en commun',
  'Dites-nous comment vous vous déplacez au quotidien et ce que vous attendez des transports en Guadeloupe.',
  null,
  '[
    {"id":"q1","type":"single","label":"Quel est votre principal moyen de transport au quotidien ?","options":["Voiture personnelle","Bus / Transport en commun","Moto / Scooter","Vélo","À pied"],"required":true},
    {"id":"q2","type":"single","label":"Utilisez-vous les transports en commun (bus CGTG, Karulis…) ?","options":["Tous les jours","Plusieurs fois par semaine","Rarement","Jamais"],"required":true},
    {"id":"q3","type":"multiple","label":"Pourquoi n''utilisez-vous pas plus les transports en commun ?","options":["Horaires insuffisants","Lignes ne correspondent pas à mes trajets","Manque de confort","Prix trop élevé","Je les utilise déjà régulièrement"]},
    {"id":"q4","type":"scale","label":"Sur 10, notez la qualité du réseau de transport en commun actuel","required":true},
    {"id":"q5","type":"single","label":"Seriez-vous prêt à utiliser un tramway ou RER guadeloupéen s''il était créé ?","options":["Oui, absolument","Probablement","Peu probable","Non"],"required":true}
  ]'::jsonb,
  true,
  '2026-05-31T00:00:00Z',
  '2026-03-15T00:00:00Z'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Vie nocturne et culture à Pointe-à-Pitre',
  'Votre avis sur l''offre culturelle et les sorties dans la métropole guadeloupéenne.',
  (select id from communes where code_insee = '97120'),
  '[
    {"id":"q1","type":"single","label":"À quelle fréquence sortez-vous le soir à Pointe-à-Pitre ?","options":["Toutes les semaines","2 à 3 fois par mois","Moins d''une fois par mois","Jamais"],"required":true},
    {"id":"q2","type":"multiple","label":"Quels types de sorties vous intéressent le plus ?","options":["Concerts / Gwoka / Zouk","Restaurants","Expositions / Musées","Bars / Terrasses","Théâtre / Spectacles","Carnaval / Fêtes locales"],"required":true},
    {"id":"q3","type":"single","label":"L''offre culturelle actuelle répond-elle à vos attentes ?","options":["Très bien","Plutôt bien","Insuffisamment","Pas du tout"],"required":true},
    {"id":"q4","type":"text","label":"Quel événement culturel manque selon vous à Pointe-à-Pitre ?"}
  ]'::jsonb,
  true,
  null,
  '2026-04-01T00:00:00Z'
)
on conflict (id) do nothing;
