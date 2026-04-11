const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, ExternalHyperlink,
  PageBreak
} = require('docx');
const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, color: '1a7a4a' })],
    spacing: { before: 480, after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, color: '0d9488' })],
    spacing: { before: 320, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, color: '374151' })],
    spacing: { before: 240, after: 80 },
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: opts.color || '374151', bold: opts.bold || false, italics: opts.italic || false })],
    spacing: { after: 140 },
    alignment: opts.align || AlignmentType.LEFT,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: [new TextRun({ text, size: 22, color: '374151' })],
    spacing: { after: 80 },
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    children: [new TextRun({ text, size: 22, color: '374151' })],
    spacing: { after: 80 },
  });
}

function spacer(n = 1) {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: n * 120 } });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' } },
    children: [new TextRun('')],
    spacing: { after: 240, before: 120 },
  });
}

function highlightBox(title, lines, bgColor = 'F0FDF4') {
  const rows = [
    new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 180, bottom: 180, left: 240, right: 240 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 24, color: '1a7a4a' })],
            spacing: { after: 80 },
          }),
          ...lines.map(l => new Paragraph({
            children: [new TextRun({ text: l, size: 21, color: '374151' })],
            spacing: { after: 60 },
          })),
        ],
      })],
    }),
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '22c55e' },
      bottom: border, left: border, right: border,
    },
  });
}

function twoColTable(rows2col) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: rows2col.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 2800, type: WidthType.DXA },
          shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: '374151' })] })],
        }),
        new TableCell({
          borders,
          width: { size: 6560, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: '4B5563' })] })],
        }),
      ],
    })),
  });
}

// ── Document ──────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }, {
          level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Calibri', color: '1a7a4a' },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Calibri', color: '0d9488' },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: '374151' },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: '22c55e' } },
          children: [new TextRun({ text: 'P\u00E9yi \u2014 Dossier de vision & architecture', size: 18, color: '9CA3AF', italics: true })],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 160 },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'P\u00E9yi \u2014 Confidentiel  |  ', size: 18, color: '9CA3AF' }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '9CA3AF' }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: [

      // ══════════════════════════════════════════════════════════════════════
      // PAGE DE TITRE
      // ══════════════════════════════════════════════════════════════════════
      spacer(4),
      new Paragraph({
        children: [new TextRun({ text: 'P\u00CDYI', bold: true, size: 96, color: '1a7a4a', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'La carte vivante de l\u2019opinion publique en Guadeloupe', size: 28, color: '0d9488', italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a7a4a' } },
        children: [new TextRun('')],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Dossier de vision, architecture & feuille de route', size: 22, color: '6B7280' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Avril 2026 \u2014 Version 1.0', size: 20, color: '9CA3AF' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 1 : LE PROBLÈME
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('1. Le probl\u00E8me qu\u2019on r\u00E9soud'),
      p('La Guadeloupe est un territoire fragment\u00E9 : 32 communes, des r\u00E9alit\u00E9s locales radicalement diff\u00E9rentes entre Pointe-\u00E0-Pitre et Terre-de-Haut, entre Capesterre-Belle-Eau et Saint-Fran\u00E7ois. Pourtant, quand une collectivit\u00E9 veut savoir ce que pensent les habitants, elle a le choix entre trois mauvaises options :'),
      bullet('Faire appel \u00E0 un institut de sondage parisien : 15 000\u20AC minimum, 6 semaines de d\u00E9lai, 200 questionnaires papier envoy\u00E9s par courrier. Le r\u00E9sultat est d\u00E9j\u00E0 p\u00E9rim\u00E9 quand il arrive.'),
      bullet('Organiser une r\u00E9union publique : 40 personnes pr\u00E9sentes, surrepr\u00E9sentation des retrait\u00E9s et des militant politiques, z\u00E9ro donn\u00E9e segment\u00E9e.'),
      bullet('Ne rien faire et d\u00E9cider dans le vide \u2014 ce qui arrive le plus souvent.'),
      spacer(),
      p('En parall\u00E8le, les citoyens guadeloup\u00E9ens n\u2019ont aucun outil pour exprimer leur avis de mani\u00E8re structur\u00E9e, le voir compar\u00E9 \u00E0 celui de leurs voisins, et suivre comment l\u2019opinion \u00E9volue dans le temps sur les sujets qui les touchent directement.'),

      spacer(),
      highlightBox(
        'La fracture num\u00E9rique civique en chiffres',
        [
          '\u2022  Taux de participation aux municipales 2020 en Guadeloupe : 38% (vs 45% national)',
          '\u2022  0 plateforme d\u2019opinion publique hyperlocale existante pour les DOM-TOM',
          '\u2022  Budget moyen d\u2019une \u00E9tude d\u2019opinion pour une commune : 8 000\u20AC \u2014 inaccessible pour 28 des 32 communes',
          '\u2022  D\u00E9lai moyen entre une d\u00E9cision politique et sa perception citoyenne : 6 \u00E0 18 mois',
        ]
      ),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 2 : LA VISION
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('2. La vision : une carte vivante de l\u2019opinion'),
      p('P\u00E9yi n\u2019est pas une application de sondage. C\u2019est une infrastructure d\u2019intelligence collective territoriale.'),
      p('L\u2019image centrale est une carte de la Guadeloupe qui respire. Chaque commune a une couleur, une intensit\u00E9, une taille qui varient en temps r\u00E9el selon ce que les habitants expriment. On voit d\u2019un coup d\u2019oeil o\u00F9 \u00E7a brule, o\u00F9 c\u2019est calme, quels sujets mobilisent, lesquels divisent.'),

      spacer(),
      h2('2.1 Ce que la carte montre'),
      bullet('La heatmap d\u2019opinion : vert (satisfait) \u2192 ambre (mitig\u00E9) \u2192 rouge (pr\u00E9occup\u00E9), calcul\u00E9e en temps r\u00E9el depuis les r\u00E9ponses'),
      bullet('Les bulles proportionnelles : taille = nombre de r\u00E9pondants par commune. On voit o\u00F9 la population s\u2019exprime'),
      bullet('Les fronti\u00E8res officielles : polygones GeoJSON IGN pr\u00E9cis pour les 32 communes'),
      bullet('Le sujet chaud : en survolant une commune, le th\u00E8me le plus actif appara\u00EEt imm\u00E9diatement'),
      bullet('L\u2019\u00E9volution temporelle : (roadmap) curseur pour voir l\u2019opinion semaine par semaine'),

      spacer(),
      h2('2.2 Ce que les trois piliers font'),
      p('L\u2019application est structur\u00E9e autour de trois piliers, mais avec une hi\u00E9rarchie claire :'),

      spacer(),
      twoColTable([
        ['Pilier 1 (central)', 'Sondages \u2014 la colonne vert\u00E9brale. Format Stories (une question \u00E0 la fois, plein \u00E9cran, swipe), segmentation d\u00E9mographique (commune, \u00E2ge, genre), r\u00E9sultats en temps r\u00E9el sur la carte.'],
        ['Pilier 2 (secondaire)', 'Actualit\u00E9s \u2014 news hyperlocales filtr\u00E9es par commune et th\u00E8me (politique, environnement, culture, sport, \u00E9conomie). Contextualise l\u2019opinion avec les faits.'],
        ['Pilier 3 (secondaire)', 'Signalements \u2014 carte interactive des probl\u00E8mes citoyens (voirie, eau, d\u00E9chets, \u00E9clairage). Compl\u00E8te la donn\u00E9e d\u2019opinion par la donn\u00E9e de terrain.'],
      ]),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 3 : L'EXPÉRIENCE UTILISATEUR
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('3. L\u2019exp\u00E9rience utilisateur'),
      h2('3.1 Le parcours principal'),
      p('L\u2019utilisateur arrive directement sur la carte. Pas de landing page, pas d\u2019onboarding. La premi\u00E8re chose qu\u2019il voit : son territoire, vivant.'),

      spacer(),
      numbered('Il localise sa commune sur la carte, voit sa couleur et son intensit\u00E9'),
      numbered('Il clique \u2014 un panel remonte du bas de l\u2019\u00E9cran avec les sondages actifs de sa commune'),
      numbered('Il appuie sur \u00AB Participer \u00BB \u2014 l\u2019\u00E9cran passe en mode Stories plein \u00E9cran'),
      numbered('Il r\u00E9pond aux questions une par une en swipant ou en tapant'),
      numbered('Apr\u00E8s soumission, il donne optionnellement son profil d\u00E9mographique (2 taps)'),
      numbered('Il voit ses r\u00E9ponses int\u00E9gr\u00E9es aux r\u00E9sultats et la carte mise \u00E0 jour'),

      spacer(),
      h2('3.2 Le format Stories \u2014 pourquoi c\u2019est crucial'),
      p('Le formulaire classique est mort. Les \u00E9tudes montrent qu\u2019un questionnaire de 10 questions affich\u00E9 d\u2019un bloc perd 60% des r\u00E9pondants avant la premi\u00E8re r\u00E9ponse. Le format Stories r\u00E9sout \u00E7a :'),

      spacer(),
      twoColTable([
        ['Une question \u00E0 la fois', 'La charge cognitive est minimale. L\u2019utilisateur ne voit pas la suite, il r\u00E9pond juste \u00E0 ce qui est devant lui.'],
        ['Plein \u00E9cran', 'Z\u00E9ro distraction. Pas de nav, pas de scroll, pas de bouton \u00AB Annuler \u00BB mis en avant. L\u2019attention est totale.'],
        ['Auto-avance', 'Pour les questions \u00E0 choix unique, taper une r\u00E9ponse fait automatiquement passer \u00E0 la suivante. Pas de bouton \u00AB Suivant \u00BB \u00E0 chercher.'],
        ['Swipe natif', 'Swipe gauche/droite pour naviguer. Geste naturel sur mobile. Touches cl\u00E9s gauche/droite sur desktop.'],
        ['\u00C9chelle \u00E9moji', 'Les questions de satisfaction utilisent un slider avec \u00E9moji r\u00E9actif (de \ud83d\ude20 \u00E0 \ud83e\udd29) plut\u00F4t qu\u2019un 1-10. Baisse la barri\u00E8re d\u2019entr\u00E9e, r\u00E9duit le biais de d\u00E9sirabilit\u00E9 sociale.'],
        ['Dur\u00E9e visible', '"\u223c2 min" affich\u00E9 d\u00E8s le d\u00E9but. L\u2019utilisateur sait o\u00F9 il en est.'],
      ]),

      spacer(),
      h2('3.3 La d\u00E9mographie : la cl\u00E9 de la valeur'),
      p('Apr\u00E8s la derni\u00E8re question, une \u00E9tape rapide (optionnelle) collecte la tranche d\u2019\u00E2ge et le genre. C\u2019est cette couche qui transforme un sondage en donn\u00E9e exploitable pour les institutions.'),
      p('Les r\u00E9sultats sont affich\u00E9s avec des filtres interactifs : on peut isoler l\u2019opinion des 25-34 ans de Capesterre, la comparer \u00E0 celle des 50-64 ans de Pointe-\u00E0-Pitre. C\u2019est exactement ce que les collectivit\u00E9s ne peuvent pas obtenir autrement.'),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 4 : TECHNIQUE
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('4. Architecture technique'),
      h2('4.1 Stack choisie et pourquoi'),

      spacer(),
      twoColTable([
        ['Frontend', 'Vue 3 (Composition API + <script setup>) \u2014 productivit\u00E9 maximale, tr\u00E8s bonne v\u00E9locit\u00E9 pour une \u00E9quipe petite'],
        ['Langage', 'TypeScript strict \u2014 s\u00E9curit\u00E9 des types, autocompl\u00E9tion, moins de bugs en production'],
        ['Style', 'Tailwind CSS v4 \u2014 design system utilitaire, pas de CSS \u00E0 maintenir, responsive mobile-first natif'],
        ['\u00C9tat global', 'Pinia \u2014 stores r\u00E9actifs, simple, typos TypeScript natifs, devtools excellents'],
        ['Routing', 'Vue Router 4 \u2014 lazy-loading automatique, guards auth, navigation programmatique'],
        ['Backend / DB', 'Supabase (Postgres + RLS + Realtime) \u2014 BaaS open-source, s\u00E9curit\u00E9 au niveau SQL, \u00E9coute temps r\u00E9el native'],
        ['Auth', 'Supabase Auth (magic link + OAuth Google) \u2014 z\u00E9ro mot de passe, r\u00E9duction friction maximale'],
        ['Carte', 'Leaflet + CartoDB tiles + GeoJSON IGN \u2014 open source, polygones pr\u00E9cis des 32 communes'],
        ['D\u00E9ploiement', 'Vercel (SPA) \u2014 CI/CD automatis\u00E9, previews PR, CDN mondial, z\u00E9ro DevOps'],
        ['Tests', 'Vitest + Vue Test Utils \u2014 m\u00EAme stack que Vite, ultra rapide'],
      ]),

      spacer(),
      h2('4.2 Mod\u00E8le de donn\u00E9es Supabase'),
      p('Cinq tables essentielles, con\u00E7ues pour la performance et la s\u00E9curit\u00E9 :'),

      spacer(),
      twoColTable([
        ['communes', '32 entr\u00E9es avec code INSEE officiel, coordonn\u00E9es GPS, nom. Source de v\u00E9rit\u00E9 g\u00E9ographique.'],
        ['news_articles', 'Articles avec commune, cat\u00E9gorie, slug unique, source. Lecture publique (RLS).'],
        ['reports', 'Signalements avec lat/lng, statut, upvotes. \u00C9criture auth ou anonyme via Edge Function rate-limit\u00E9e.'],
        ['surveys', 'Sondages avec questions en JSONB flexible ({id, type, label, options}). Nullable commune_id = national.'],
        ['survey_responses', 'R\u00E9ponses avec JSONB answers + demographics. Unique (survey_id, respondent_id) \u2014 un vote par personne. Pas de lecture individuelle (RLS), uniquement agr\u00E9g\u00E9e.'],
      ]),

      spacer(),
      h2('4.3 S\u00E9curit\u00E9 \u2014 Row Level Security'),
      p('Chaque table a des politiques RLS d\u00E9finies directement dans Postgres, pas dans le code applicatif. Cela garantit que m\u00EAme si le frontend est compromis, les donn\u00E9es restent prot\u00E9g\u00E9es :'),
      bullet('communes, news_articles, surveys : lecture publique totale'),
      bullet('reports : lecture publique, \u00E9criture contr\u00F4l\u00E9e par Edge Function'),
      bullet('survey_responses : insert seul, pas de SELECT individuel \u2014 ni l\u2019utilisateur ni les admins ne peuvent voir les r\u00E9ponses individuelles'),
      bullet('Admins : r\u00F4le peyi_admin dans app_metadata JWT \u2014 acc\u00E8s total'),

      spacer(),
      highlightBox(
        'Choix architecturaux cl\u00E9s',
        [
          'Fingerprint anonyme (localStorage UUID) pour la d\u00E9duplication des votes \u2014 pas de compte obligatoire',
          'Fallback mock data : si Supabase est indisponible, l\u2019app fonctionne avec des donn\u00E9es locales',
          'Lazy-loading de toutes les vues : bundle initial minimal, le code se t\u00E9l\u00E9charge \u00E0 la demande',
          'Leaflet charg\u00E9 dynamiquement (import()) : ne bloque pas le rendu de la carte',
          'GeoJSON complet IGN (108 KB gzipp\u00E9 \u00E0 27 KB) \u2014 polygones officiels des 32 communes',
        ],
        'EFF6FF'
      ),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 5 : CE QUI EST CONSTRUIT
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('5. Ce qui est construit aujourd\u2019hui'),
      p('Le projet est dans un \u00E9tat fonctionnel avanc\u00E9. Voici l\u2019inventaire pr\u00E9cis de ce qui existe et tourne :'),

      spacer(),
      h2('5.1 Carte principale (HomeView)'),
      bullet('Carte CartoDB dark, centr\u00E9e sur la Guadeloupe au zoom 10'),
      bullet('32 polygones communaux avec fronti\u00E8res blanches (GeoJSON IGN officiel)'),
      bullet('Heatmap dynamique : couleur calcul\u00E9e depuis participantCount + opinionScore'),
      bullet('Bulles proportionnelles au centroide de chaque commune'),
      bullet('Labels blancs des noms de communes avec text-shadow'),
      bullet('Survol : highlight de la commune + tooltip (nb r\u00E9pondants, sujet chaud)'),
      bullet('Clic : panel slide-up avec stats et sondages actifs de la commune'),
      bullet('L\u00E9gende interactive en haut \u00E0 droite'),

      spacer(),
      h2('5.2 Format Stories (SurveyStory.vue)'),
      bullet('Plein \u00E9cran fond noir, barre de progression en segments'),
      bullet('4 types de questions : choix unique, choix multiple, \u00E9chelle, texte libre'),
      bullet('Auto-avance pour les choix uniques (350ms apr\u00E8s s\u00E9lection)'),
      bullet('\u00C9chelle avec slider + \u00E9moji r\u00E9actif (7 niveaux, de \ud83d\ude20 \u00E0 \ud83e\udd29)'),
      bullet('Swipe tactile gauche/droite + touches clavier \u2190/\u2192'),
      bullet('Phase d\u00E9mographie post-r\u00E9ponse (2 taps : \u00E2ge + genre)'),
      bullet('\u00C9cran de fin avec lien vers r\u00E9sultats'),
      bullet('Animations slide-left/slide-right avec transition out-in'),

      spacer(),
      h2('5.3 Visualisation des r\u00E9sultats'),
      bullet('Barres horizontales CSS avec % et compteur brut par option'),
      bullet('Histogramme de distribution pour les questions d\u2019\u00E9chelle'),
      bullet('Filtres de segmentation interactifs : tranche d\u2019\u00E2ge ET genre'),
      bullet('Les graphiques se recalculent en temps r\u00E9el lors du filtrage'),
      bullet('Profil d\u00E9mographique des r\u00E9pondants (distribution \u00E2ge + genre)'),
      bullet('Donn\u00E9es mock r\u00E9alistes : 252 r\u00E9ponses sur 3 sondages actifs'),

      spacer(),
      h2('5.4 Navigation & UX'),
      bullet('Bottom nav mobile-first : Carte / Sondages / Plus'),
      bullet('Menu secondaire slide-up : Actualit\u00E9s + Signalements'),
      bullet('Vue Stories plein \u00E9cran (masque la nav automatiquement)'),
      bullet('Panel commune avec stats, barre d\u2019intensit\u00E9, liste des sondages actifs'),
      bullet('Gestion du fingerprint anonyme (localStorage) pour d\u00E9duplication'),

      spacer(),
      h2('5.5 Structure du code'),
      twoColTable([
        ['src/data/', 'communeStats.ts (32 communes avec stats), mockSurveys.ts (3 sondages + 252 r\u00E9ponses), communes-971.json (GeoJSON IGN)'],
        ['src/services/', 'supabase.ts (client), newsService.ts, reportsService.ts, surveysService.ts \u2014 tous avec fallback mock'],
        ['src/stores/', '4 Pinia stores (auth, news, reports, surveys) \u2014 setup syntax, TypeScript strict'],
        ['src/composables/', 'useAuth, useCommune, useGeolocation \u2014 logique r\u00E9utilisable'],
        ['src/components/', 'CommuneMap, CommunePanel, SurveyStory, SurveyResultsChart, AppNav'],
        ['src/views/', '6 vues : Home, NewsListView/Detail, ReportsMapView/Detail, SurveysListView/Detail + SurveyStoryView'],
        ['supabase/', 'migrations/001 (sch\u00E9ma complet + RLS + triggers), seed/communes.sql'],
        ['.github/', 'workflow CI/CD : typecheck + preview PR + d\u00E9ploiement prod sur main'],
      ]),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 6 : MODÈLE ÉCONOMIQUE
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('6. Le mod\u00E8le \u00E9conomique'),
      p('P\u00E9yi a un mod\u00E8le \u00E9conomique B2B2C clair. La plateforme est gratuite pour les citoyens \u2014 c\u2019est ce qui cr\u00E9e la masse de donn\u00E9es. La valeur est vendue aux institutions.'),

      spacer(),
      h2('6.1 L\u2019acheteur : les collectivit\u00E9s territoriales'),
      p('La R\u00E9gion Guadeloupe, le D\u00E9partement, les mairies, les intercommunalit\u00E9s ont un besoin constant de donn\u00E9es d\u2019opinion pour :'),
      bullet('Justifier des d\u00E9cisions politiques aupr\u00E8s des \u00E9lus et des m\u00E9dias'),
      bullet('Pr\u00E9parer des dossiers de financement europ\u00E9ens (FEDER, FSE) qui exigent une consultation citoyenne'),
      bullet('\u00C9valuer l\u2019impact de leurs actions (avant/apr\u00E8s r\u00E9novation d\u2019une route, apr\u00E8s une crise de l\u2019eau)'),
      bullet('Identifier les sujets prioritaires avant une \u00E9lection ou un conseil municipal'),

      spacer(),
      h2('6.2 Ce qu\u2019on leur vend'),
      twoColTable([
        ['Abonnement Standard', '2 000\u20AC/an par commune \u2014 acc\u00E8s aux donn\u00E9es agr\u00E9g\u00E9es de leur commune en temps r\u00E9el, export CSV, dashboard'],
        ['Abonnement Premium', '5 000\u20AC/an \u2014 cr\u00E9ation de sondages sur-mesure, segmentation avanc\u00E9e, rapports PDF automatis\u00E9s, API'],
        ['Rapports \u00E0 la carte', '800\u20AC/rapport \u2014 analyse qualitative d\u2019un sujet sp\u00E9cifique, comparaison inter-communes, recommandations'],
        ['Offre R\u00E9gion / D\u00E9partement', '15 000\u20AC/an \u2014 acc\u00E8s \u00E0 l\u2019ensemble des donn\u00E9es du territoire, tableau de bord ex\u00E9cutif, SLA garanti'],
      ]),

      spacer(),
      h2('6.3 Projection \u00E0 3 ans'),
      twoColTable([
        ['Ann\u00E9e 1', '5 communes abonn\u00E9es Standard + 1 rapport D\u00E9partement = ~15 000\u20AC ARR. Objectif : prouver le produit, constituer le premier dataset r\u00E9el.'],
        ['Ann\u00E9e 2', '15 communes + 2 Premi\u00E8res r\u00E9gionales + acc\u00E8s R\u00E9gion = ~60 000\u20AC ARR. Extension aux autres DOM : Martinique, R\u00E9union.'],
        ['Ann\u00E9e 3', 'Plateforme multi-DOM, 3 r\u00E9gions abonees, march\u00E9 Afrique francophone (Antilles, Polynesie) = 200 000\u20AC+ ARR.'],
      ]),

      spacer(),
      highlightBox(
        'Comparatif concurrentiel',
        [
          'Institut de sondage classique : 8 000\u20AC\u201315 000\u20AC par \u00E9tude, 6 semaines, 200 r\u00E9pondants, pas de mise \u00E0 jour',
          'P\u00E9yi Standard : 2 000\u20AC/an, temps r\u00E9el, milliers de r\u00E9pondants, historique complet',
          'Avantage concurrentiel : donn\u00E9es longitudinales (on voit l\u2019\u00E9volution dans le temps), segmentation g\u00E9ographique pr\u00E9cise (commune), co\u00FBt 10x inf\u00E9rieur',
        ],
        'FFFBEB'
      ),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 7 : ROADMAP
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('7. Feuille de route'),

      h2('Phase 0 \u2014 Termin\u00E9e \u2714'),
      bullet('Initialisation du projet Vue 3 + Supabase + Tailwind + Leaflet'),
      bullet('Architecture compl\u00E8te : stores, services, composables, router'),
      bullet('Sch\u00E9ma Supabase avec RLS : communes, news, reports, surveys, survey_responses'),
      bullet('Seed 32 communes avec coordonn\u00E9es GPS'),
      bullet('Mock data r\u00E9aliste : 3 sondages, 252 r\u00E9ponses, statistiques par commune'),
      bullet('Carte heatmap avec GeoJSON IGN officiel (polygones pr\u00E9cis des 32 communes)'),
      bullet('Format Stories plein \u00E9cran avec 4 types de questions'),
      bullet('Visualisation des r\u00E9sultats avec filtres d\u00E9mographiques'),
      bullet('Bottom nav mobile-first, panel commune, CI/CD Vercel'),

      spacer(),
      h2('Phase 1 \u2014 Semaines 1\u20134 : Production ready'),
      bullet('Connexion Supabase r\u00E9elle : remplacement des mock data par vraies tables'),
      bullet('Auth magic link : inscription sans friction, session persist\u00E9e'),
      bullet('PWA : manifest.json + service worker (Vite PWA plugin) \u2014 installable sur t\u00E9l\u00E9phone'),
      bullet('Notifications push : \u00AB Nouveau sondage dans ta commune \u00BB'),
      bullet('Micro-sondages quotidiens : 3 questions maximum, nouveau sujet chaque jour'),
      bullet('Partage r\u00E9seaux sociaux : carte de r\u00E9sultats g\u00E9n\u00E9r\u00E9e en image'),
      bullet('Panel admin : cr\u00E9ation de sondages, moderation signalements, statistiques'),

      spacer(),
      h2('Phase 2 \u2014 Mois 2\u20133 : Engagement & data'),
      bullet('Filtre temporel sur la carte : curseur pour voir l\u2019\u00E9volution semaine par semaine'),
      bullet('Comparaison inter-communes : \u00AB Ma commune vs la moyenne Guadeloupe \u00BB'),
      bullet('Fils d\u2019actualit\u00E9 par commune avec scraping des sites mairies + ONGs locales'),
      bullet('Signalements enrichis : photos, g\u00E9olocalisation pr\u00E9cise, historique statut'),
      bullet('Syst\u00E8me de streak : \u00AB Tu r\u00E9ponds depuis 7 jours \u00BB (engagement quotidien)'),
      bullet('Export CSV/PDF des donn\u00E9es pour les collectivit\u00E9s'),

      spacer(),
      h2('Phase 3 \u2014 Mois 4\u20136 : Croissance & B2B'),
      bullet('Dashboard collectivit\u00E9s : tableau de bord d\u00E9di\u00E9, rapports automatis\u00E9s'),
      bullet('API publique pour int\u00E9gration dans les outils des mairies'),
      bullet('Extension Martinique : m\u00EAme architecture, nouvelles communes, sondages sp\u00E9cifiques'),
      bullet('Partenariats m\u00E9dias locaux (France Antilles, Guadeloupe La 1\u00E8re) pour les actualit\u00E9s'),
      bullet('Campagnes de sondages sponsoris\u00E9es par les collectivit\u00E9s'),
      bullet('App native via Capacitor si entr\u00E9e en App Store requise pour contrats B2B'),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 8 : QUESTIONS OUVERTES
      // ══════════════════════════════════════════════════════════════════════
      new Paragraph({ children: [new PageBreak()] }),

      h1('8. Questions ouvertes \u2014 sujets \u00E0 d\u00E9battre'),
      p('Ces points m\u00E9ritent discussion avec d\u2019autres regards :'),

      spacer(),
      h2('8.1 Web ou application t\u00E9l\u00E9chargeable ?'),
      p('Aujourd\u2019hui : SPA web d\u00E9ploy\u00E9e sur Vercel. La PWA (Progressive Web App) permet l\u2019installation sur l\u2019\u00E9cran d\u2019accueil sans App Store, les notifications push, le mode hors-ligne.'),
      p('L\u2019app native (via Capacitor ou React Native) n\u2019est pertinente que si les contrats institutionnels l\u2019exigent ou si on cible les App Store pour la visibilit\u00E9. Recommandation actuelle : PWA d\u2019abord.'),

      spacer(),
      h2('8.2 Anonymat vs authentification'),
      p('Actuellement : fingerprint localStorage pour la d\u00E9duplication. Pas de compte obligatoire. C\u2019est la friction minimale, mais la donn\u00E9e est moins fiable (changement de navigateur = nouvelle identit\u00E9).'),
      p('Question : faut-il inciter ou obliger l\u2019inscription pour am\u00E9liorer la qualit\u00E9 des donn\u00E9es ? Trade-off engagement vs fiabilit\u00E9.'),

      spacer(),
      h2('8.3 Gouvernance des sondages'),
      p('Qui cr\u00E9e les sondages ? Aujourd\u2019hui : un admin. Mais \u00E0 terme, doit-on permettre aux mairies de cr\u00E9er leurs propres sondages ? Aux citoyens de proposer des sujets ? Comment \u00E9viter les manipulations ?'),

      spacer(),
      h2('8.4 Repr\u00E9sentativit\u00E9 statistique'),
      p('Les r\u00E9sultats P\u00E9yi ne sont pas statistiquement repr\u00E9sentatifs (pas d\u2019\u00E9chantillonnage al\u00E9atoire). Comment communiquer cette nuance aux collectivit\u00E9s ? Et comment la ponderation par d\u00E9mographie peut-elle compenser partiellement ce biais ?'),

      spacer(),
      h2('8.5 Expansion g\u00E9ographique'),
      p('La Martinique, La R\u00E9union, la Polynesie fran\u00E7aise ont exactement le m\u00EAme probl\u00E8me. L\u2019architecture est multi-territoire par conception (le champ department dans la table communes). Quelle est la priorisation ?'),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 9 : STACK DÉCISIONS SUMMARY
      // ══════════════════════════════════════════════════════════════════════
      divider(),
      h1('9. R\u00E9sum\u00E9 ex\u00E9cutif en une page'),

      spacer(),
      highlightBox('Ce qu\u2019est P\u00E9yi', [
        'Une plateforme de d\u00E9mocratie participative hyperlocale pour la Guadeloupe.',
        'Interface principale = une carte de l\u2019\u00EEle avec une heatmap d\u2019opinion par commune.',
        'Exp\u00E9rience utilisateur = format Stories (une question, plein \u00E9cran, swipe) pour r\u00E9pondre en 2 minutes.',
        'Valeur B2B = donn\u00E9es d\u2019opinion en temps r\u00E9el, segment\u00E9es par commune / \u00E2ge / genre, vendues aux collectivit\u00E9s.',
      ], 'F0FDF4'),

      spacer(),
      highlightBox('Ce qu\u2019on a construit', [
        'Carte heatmap avec polygones officiels IGN des 32 communes, bulles proportionnelles, panel d\u00E9tail.',
        'Format Stories complet : 4 types de questions, swipe, auto-avance, \u00E9moji scale, d\u00E9mographie.',
        'Visualisation des r\u00E9sultats avec filtres interactifs par \u00E2ge et genre.',
        'Infrastructure Supabase (sch\u00E9ma + RLS), CI/CD Vercel, TypeScript strict.',
        'Mock data r\u00E9aliste : 3 sondages op\u00E9rationnels sur eau, transport, culture.',
      ], 'EFF6FF'),

      spacer(),
      highlightBox('Ce qu\u2019on fait ensuite', [
        'Phase 1 : connexion Supabase r\u00E9elle + PWA + notifications push + admin panel.',
        'Phase 2 : filtre temporel sur la carte + comparaison inter-communes + gamification.',
        'Phase 3 : dashboard B2B collectivit\u00E9s + API + extension Martinique.',
      ], 'FFFBEB'),

      spacer(),
      p('\u2014', { align: AlignmentType.CENTER, color: '9CA3AF' }),
      p('Document pr\u00E9par\u00E9 pour discussion avec partenaires et consultants.', { align: AlignmentType.CENTER, italic: true, color: '9CA3AF' }),
      p('P\u00E9yi \u2014 Bienvenu an p\u00E9yi-a \ud83c\uddec\ud83c\uddf5', { align: AlignmentType.CENTER, bold: true, color: '1a7a4a' }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/asapwork/Projects/peyi/docs/Peyi-Vision-Architecture.docx', buffer);
  console.log('Done: Peyi-Vision-Architecture.docx');
});
