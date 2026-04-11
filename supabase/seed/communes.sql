-- Seed : 32 communes de Guadeloupe avec codes INSEE corrects (source : IGN / communeStats)
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- Les coordonnées sont les centroïdes approximatifs de chaque commune

insert into communes (name, code_insee, department, lat, lng) values
-- ── Grande-Terre ─────────────────────────────────────────────────────────────
('Les Abymes',                '97101', '971',  16.2693, -61.5043),
('Anse-Bertrand',             '97102', '971',  16.4726, -61.5143),
('Baie-Mahault',              '97103', '971',  16.2694, -61.5885),
('Le Gosier',                 '97113', '971',  16.2051, -61.5011),
('Goyave',                    '97114', '971',  16.1750, -61.5713),
('Le Moule',                  '97117', '971',  16.3354, -61.3526),
('Morne-à-l''Eau',            '97116', '971',  16.3339, -61.5404),
('Petit-Canal',               '97119', '971',  16.3873, -61.4940),
('Pointe-à-Pitre',            '97120', '971',  16.2410, -61.5332),
('Port-Louis',                '97122', '971',  16.4179, -61.5357),
('Saint-François',            '97125', '971',  16.2567, -61.2742),
('Sainte-Anne',               '97128', '971',  16.2274, -61.3836),
-- ── Basse-Terre ──────────────────────────────────────────────────────────────
('Baillif',                   '97104', '971',  15.9836, -61.7498),
('Basse-Terre',               '97105', '971',  15.9959, -61.7261),
('Bouillante',                '97106', '971',  16.1259, -61.7755),
('Capesterre-Belle-Eau',      '97107', '971',  15.9125, -61.5625),
('Deshaies',                  '97111', '971',  16.3060, -61.7972),
('Gourbeyre',                 '97109', '971',  15.9739, -61.7025),
('Le Lamentin',               '97115', '971',  16.2667, -61.6333),
('Petit-Bourg',               '97118', '971',  16.1974, -61.5840),
('Pointe-Noire',              '97121', '971',  16.2335, -61.7872),
('Saint-Claude',              '97124', '971',  16.0330, -61.7057),
('Sainte-Rose',               '97129', '971',  16.3230, -61.7016),
('Trois-Rivières',            '97132', '971',  15.9651, -61.6509),
('Vieux-Fort',                '97133', '971',  15.9434, -61.7010),
('Vieux-Habitants',           '97134', '971',  16.0620, -61.7600),
-- ── Marie-Galante ────────────────────────────────────────────────────────────
('Capesterre-de-Marie-Galante','97108','971',  15.9200, -61.2400),
('Grand-Bourg',               '97112', '971',  15.8815, -61.3148),
('Saint-Louis',               '97126', '971',  15.9501, -61.3003),
-- ── La Désirade ──────────────────────────────────────────────────────────────
('La Désirade',               '97110', '971',  16.3057, -61.0448),
-- ── Les Saintes ──────────────────────────────────────────────────────────────
('Terre-de-Bas',              '97130', '971',  15.8594, -61.6556),
('Terre-de-Haut',             '97131', '971',  15.8694, -61.5997)
on conflict (code_insee) do update set
  name        = excluded.name,
  lat         = excluded.lat,
  lng         = excluded.lng,
  department  = excluded.department;
