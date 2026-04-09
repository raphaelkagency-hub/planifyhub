import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'
import { hasFeature } from '@/lib/subscription'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'pointage'
  const periode = searchParams.get('periode')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const abonnement = session!.user.abonnement as any
  const hasFullExport = hasFeature(abonnement, 'exportComplet')
  const hasLimitedExport = hasFeature(abonnement, 'exportLimite')

  if (!hasLimitedExport && !hasFullExport) {
    return NextResponse.json({ error: 'Export non disponible avec votre abonnement' }, { status: 403 })
  }

  try {
    let data: any[] = []
    let sheetName = 'Export'
    let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`

    if (type === 'pointage') {
      const where: any = { entrepriseId: session!.user.entrepriseId }
      if (start && end) {
        where.date = { gte: new Date(start), lte: new Date(end + 'T23:59:59') }
      }

      const pointages = await prisma.pointage.findMany({
        where,
        include: { employe: { select: { nom: true, prenom: true, poste: true } } },
        orderBy: [{ date: 'asc' }, { employe: { nom: 'asc' } }],
        take: hasFullExport ? undefined : 100, // Limit for basic plan
      })

      data = pointages.map(p => ({
        'Prénom': p.employe.prenom,
        'Nom': p.employe.nom,
        'Poste': p.employe.poste ?? '',
        'Date': new Date(p.date).toLocaleDateString('fr-FR'),
        'Arrivée': p.heureArrivee ?? '',
        'Départ': p.heureDepart ?? '',
        'Pause (min)': p.pauseDuree,
        'Heures travaillées': p.heuresTravaillees?.toFixed(2) ?? '',
        'Statut': p.statut,
        'Notes': p.notes ?? '',
        'Validé': p.valide ? 'Oui' : 'Non',
      }))
      sheetName = 'Pointages'
      filename = `pointages_${new Date().toISOString().split('T')[0]}.xlsx`

    } else if (type === 'paie') {
      const where: any = { entrepriseId: session!.user.entrepriseId }
      if (periode) where.periode = periode

      const paies = await prisma.paie.findMany({
        where,
        include: { employe: { select: { nom: true, prenom: true, poste: true } } },
        orderBy: [{ periode: 'desc' }, { employe: { nom: 'asc' } }],
        take: hasFullExport ? undefined : 50,
      })

      data = paies.map(p => ({
        'Prénom': p.employe.prenom,
        'Nom': p.employe.nom,
        'Poste': p.employe.poste ?? '',
        'Période': p.periode,
        'Heures travaillées': p.heuresTravaillees.toFixed(2),
        'Heures supp.': p.heuresSupp.toFixed(2),
        'Taux horaire (€)': p.tauxHoraire.toFixed(2),
        'Salaire brut (€)': p.salaireBrut.toFixed(2),
        'Cotisations salariales (€)': p.cotisationsSalariales.toFixed(2),
        'Salaire net (€)': p.salaireNet.toFixed(2),
        'Charges patronales (€)': p.cotisationsPatronales.toFixed(2),
        'Notes': p.notes ?? '',
      }))
      sheetName = 'Fiches de paie'
      filename = `paie_${periode ?? 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`

    } else if (type === 'planning') {
      const where: any = { entrepriseId: session!.user.entrepriseId }
      if (start && end) {
        where.date = { gte: new Date(start), lte: new Date(end + 'T23:59:59') }
      }

      const plannings = await prisma.planning.findMany({
        where,
        include: { employe: { select: { nom: true, prenom: true, poste: true } } },
        orderBy: [{ date: 'asc' }],
        take: hasFullExport ? undefined : 100,
      })

      data = plannings.map(p => ({
        'Prénom': p.employe?.prenom ?? 'Tous',
        'Nom': p.employe?.nom ?? '',
        'Date': new Date(p.date).toLocaleDateString('fr-FR'),
        'Heure début': p.heureDebut,
        'Heure fin': p.heureFin,
        'Pause (min)': p.pauseDuree,
        'Statut': p.statut,
        'Notes': p.notes ?? '',
      }))
      sheetName = 'Planning'
      filename = `planning_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Auto column widths
    const colWidths = Object.keys(data[0] ?? {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length)) + 2
    }))
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 })
  }
}
