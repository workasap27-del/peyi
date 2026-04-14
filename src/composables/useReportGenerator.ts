import { ref } from 'vue'
import type { Survey, SurveyResponse } from '@/types'

export function useReportGenerator() {
  const generating = ref(false)

  async function generateReport(
    _surveyId: string,
    survey: Survey,
    responses: SurveyResponse[],
    q1Options: { label: string; count: number; pct: number }[],
    demo: { genre: Record<string, number>; age: Record<string, number>; commune: Record<string, number> },
    biasFlags: string[],
  ) {
    generating.value = true
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = 210
      const GREEN = [6, 95, 70] as [number, number, number]
      const DARK  = [17, 24, 39] as [number, number, number]
      const GRAY  = [107, 114, 128] as [number, number, number]

      const n = responses.length
      const margin = n >= 2 ? Math.round((1 / Math.sqrt(n)) * 100 * 10) / 10 : null
      const score  = n >= 500 ? 'A' : n >= 200 ? 'B' : n >= 50 ? 'C' : 'D'

      const periodFrom = new Date(survey.created_at).toLocaleDateString('fr-FR')
      const periodTo = survey.ends_at ? new Date(survey.ends_at).toLocaleDateString('fr-FR') : 'en cours'

      const FOOTER = 'Données collectées par Péyi · Institut de sondage citoyen Guadeloupe · peyi.fr'

      function addFooter(pageNum: number) {
        doc.setFontSize(7)
        doc.setTextColor(...GRAY)
        doc.text(FOOTER, W / 2, 290, { align: 'center' })
        doc.text(`Page ${pageNum}`, W - 15, 290)
      }

      // ── PAGE 1 : Couverture ───────────────────────────────────────────────
      doc.setFillColor(...GREEN)
      doc.rect(0, 0, W, 297, 'F')
      doc.setFontSize(52)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('PÉYI', W / 2, 70, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Institut de sondage citoyen — Guadeloupe', W / 2, 85, { align: 'center' })
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(survey.title, 160)
      doc.text(titleLines, W / 2, 130, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Clôturé le ${periodTo}`, W / 2, 160, { align: 'center' })
      doc.text(`${n} répondants · Marge ±${margin ?? '—'}% · Score ${score}`, W / 2, 170, { align: 'center' })
      addFooter(1)

      // ── PAGE 2 : Résumé exécutif ──────────────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Résumé exécutif', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.setLineWidth(0.8)
      doc.line(20, 35, 190, 35)

      const top = q1Options.sort((a, b) => b.pct - a.pct)[0]
      const summaryLines = [
        `Résultat principal : "${top?.label ?? 'N/A'}" recueille ${top?.pct ?? 0}% des réponses sur ${n} répondants.`,
        `Fait notable : ${Object.keys(demo.commune).length > 0 ? `La commune la plus représentée est "${Object.entries(demo.commune).sort((a,b)=>b[1]-a[1])[0]?.[0]}"` : 'Aucune donnée géographique disponible'}.`,
        `Score de fiabilité ${score} — ${score === 'A' ? 'résultats statistiquement solides.' : score === 'B' ? 'résultats fiables avec légère réserve.' : score === 'C' ? 'résultats indicatifs, prudence recommandée.' : 'échantillon insuffisant, résultats à titre indicatif uniquement.'}`,
      ]

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      let y = 50
      for (const line of summaryLines) {
        const wrapped = doc.splitTextToSize(`• ${line}`, 170)
        doc.text(wrapped, 20, y)
        y += wrapped.length * 7 + 4
      }
      addFooter(2)

      // ── PAGE 3 : Méthodologie ─────────────────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Méthodologie', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      const methodLines = [
        ['Période', `${periodFrom} → ${periodTo}`],
        ['N répondants', `${n}`],
        ['Mode de collecte', 'Web anonyme (identifiant localStorage, sans authentification)'],
        ['Marge d\'erreur', margin ? `± ${margin}% (formule : 1/√n × 100)` : 'Non calculable (n < 2)'],
        ['Score fiabilité', `${score} — ${score === 'A' ? 'Très fiable' : score === 'B' ? 'Fiable' : score === 'C' ? 'Faible' : 'Indicatif'}`],
        ['Limites', 'Auto-sélection, pas de redressement démographique, biais numériques potentiels'],
      ]

      y = 48
      doc.setFontSize(10)
      for (const [label, val] of methodLines) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text(label + ' :', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GRAY)
        const wrapped = doc.splitTextToSize(val, 130)
        doc.text(wrapped, 60, y)
        y += Math.max(wrapped.length, 1) * 6 + 4
      }
      addFooter(3)

      // ── PAGES 4-5 : Résultats détaillés ──────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Résultats détaillés', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      y = 48
      doc.setFontSize(10)
      for (const opt of q1Options.sort((a, b) => b.pct - a.pct)) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK)
        doc.text(opt.label, 20, y)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...GREEN)
        doc.text(`${opt.pct}%`, 170, y, { align: 'right' })
        // Barre
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(20, y + 2, 150, 4, 2, 2, 'F')
        if (opt.pct > 0) {
          doc.setFillColor(...GREEN)
          doc.roundedRect(20, y + 2, 150 * opt.pct / 100, 4, 2, 2, 'F')
        }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GRAY)
        doc.text(`${opt.count} répondants`, 20, y + 10)
        y += 22
        doc.setFontSize(10)
      }
      addFooter(4)

      // ── PAGE 5 : Ventilation démographique ───────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Ventilation démographique', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      y = 48
      for (const [section, data] of [['Genre', demo.genre], ['Âge', demo.age]] as [string, Record<string, number>][]) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text(section, 20, y)
        y += 6
        const total = Object.values(data).reduce((s, v) => s + v, 0) || 1
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        for (const [label, cnt] of Object.entries(data)) {
          const pct = Math.round(cnt / total * 100)
          doc.setTextColor(...GRAY)
          doc.text(`${label} : ${cnt} (${pct}%)`, 25, y)
          y += 5
        }
        y += 4
      }
      addFooter(5)

      // ── PAGE 6 : Carte par communes ───────────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Résultats par commune', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      y = 48
      const sortedCommunes = Object.entries(demo.commune).sort((a, b) => b[1] - a[1])
      const totalN = sortedCommunes.reduce((s, [, c]) => s + c, 0) || 1
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      for (const [commune, cnt] of sortedCommunes) {
        const pct = Math.round((cnt as number) / totalN * 100)
        doc.setTextColor(...DARK)
        doc.text(commune, 20, y)
        doc.text(`${cnt} répondants (${pct}%)`, 100, y)
        doc.setFillColor(...GREEN)
        doc.setFillColor(16, 185, 129, Math.min(255, Math.round(pct * 2.55)))
        doc.roundedRect(160, y - 3, 30 * pct / 100, 3.5, 1, 1, 'F')
        y += 7
        if (y > 270) break
      }
      addFooter(6)

      // ── PAGE 7 : Tableau complet communes ────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Données complètes par commune', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      // En-tête tableau
      doc.setFillColor(243, 244, 246)
      doc.rect(20, 40, 170, 7, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text('Commune', 22, 45)
      doc.text('N', 120, 45)
      doc.text('%', 145, 45)

      y = 54
      doc.setFont('helvetica', 'normal')
      for (const [commune, cnt] of sortedCommunes) {
        const pct = Math.round((cnt as number) / totalN * 100)
        doc.setTextColor(...DARK)
        doc.text(String(commune), 22, y)
        doc.text(String(cnt), 120, y)
        doc.text(`${pct}%`, 145, y)
        y += 6
        if (y > 270) break
      }
      addFooter(7)

      // ── PAGE 8 : Interprétation ───────────────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Interprétation', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)

      y = 48
      const interp1 = `Constat factuel : Sur ${n} répondants, "${top?.label}" est la réponse dominante avec ${top?.pct}% des voix. La marge d'erreur de ±${margin ?? '—'}% indique que ces résultats sont ${score === 'A' || score === 'B' ? 'statistiquement fiables' : 'à considérer avec prudence'}.`
      const interp2 = `Nuances démographiques : ${Object.keys(demo.age).length > 0 ? `La tranche d'âge la plus représentée est "${Object.entries(demo.age).sort((a,b)=>b[1]-a[1])[0]?.[0]}".` : 'Peu de données démographiques disponibles.'} ${Object.keys(demo.genre).length > 0 ? `Genre : ${Object.entries(demo.genre).map(([k,v])=>`${k} (${v})`).join(', ')}.` : ''}`
      const interp3 = `Perspective : Ces données constituent un signal utile pour les décideurs locaux. ${biasFlags.length > 0 ? 'Les biais identifiés (voir page 9) doivent être pris en compte avant toute décision.' : 'Aucun biais majeur n\'a été détecté dans cet échantillon.'}`

      for (const para of [interp1, interp2, interp3]) {
        const wrapped = doc.splitTextToSize(para, 170)
        doc.text(wrapped, 20, y)
        y += wrapped.length * 6 + 8
      }
      addFooter(8)

      // ── PAGE 9 : Points de vigilance ─────────────────────────────────────
      doc.addPage()
      doc.setFontSize(18)
      doc.setTextColor(...DARK)
      doc.setFont('helvetica', 'bold')
      doc.text('Points de vigilance méthodologiques', 20, 30)
      doc.setDrawColor(...GREEN)
      doc.line(20, 35, 190, 35)

      y = 48
      if (!biasFlags.length) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GRAY)
        doc.text('Aucun biais majeur détecté dans cet échantillon.', 20, y)
      } else {
        for (const flag of biasFlags) {
          doc.setFillColor(255, 251, 235)
          doc.roundedRect(18, y - 4, 174, 10, 2, 2, 'F')
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(146, 64, 14)
          doc.text(`⚠ ${flag}`, 22, y + 1)
          y += 14
        }
      }

      // Limites standard
      y += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text('Limites inhérentes à la méthode :', 20, y)
      y += 7
      const limits = [
        'Auto-sélection : les répondants actifs sur le web ne représentent pas l\'ensemble de la population.',
        'Biais de désirabilité sociale possible sur les questions politiques.',
        'Pas de redressement démographique appliqué aux données brutes.',
        'Collecte exclusivement numérique, sous-représentation possible des personnes âgées ou peu connectées.',
      ]
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      for (const lim of limits) {
        const wrapped = doc.splitTextToSize(`• ${lim}`, 170)
        doc.text(wrapped, 20, y)
        y += wrapped.length * 5 + 3
      }

      addFooter(9)

      // ── Sauvegarde ────────────────────────────────────────────────────────
      const filename = `peyi-rapport-${survey.title.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`
      doc.save(filename)

    } finally {
      generating.value = false
    }
  }

  return { generateReport, generating }
}
