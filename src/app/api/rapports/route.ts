import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { hasFeature } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const abonnement = session!.user.abonnement as any
  if (!hasFeature(abonnement, 'rapportsRHFinanciers')) {
    return NextResponse.json({ error: 'Rapports non disponibles avec votre abonnement' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const periode = searchParams.get('periode') ?? ''

  const [year, month] = periode.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [employes, pointages, paies] = await Promise.all([
    prisma.employe.count({
      where: { entrepriseId: session!.user.entrepriseId, actif: true },
    }),
    prisma.pointage.findMany({
      where: {
        entrepriseId: session!.user.entrepriseId,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        employe: { select: { nom: true, prenom: true } },
      },
    }),
    prisma.paie.findMany({
      where: {
        entrepriseId: session!.user.entrepriseId,
        periode,
      },
    }),
  ])

  const totalHeures = pointages.reduce((sum, p) => sum + (p.heuresTravaillees ?? 0), 0)
  const totalSalaires = paies.reduce((sum, p) => sum + p.salaireNet, 0)
  const moyenneHeures = employes > 0 ? totalHeures / employes : 0

  const presences = pointages.filter(p => p.statut === 'PRESENT').length
  const absences = pointages.filter(p => p.statut === 'ABSENT').length
  const total = pointages.length
  const tauxPresence = total > 0 ? (presences / total) * 100 : 0
  const tauxAbsence = total > 0 ? (absences / total) * 100 : 0

  // Top employees by hours
  const heuresByEmploye: Record<string, { nom: string; prenom: string; heures: number }> = {}
  for (const p of pointages) {
    if (p.statut === 'PRESENT' && p.heuresTravaillees) {
      const key = p.employeId
      if (!heuresByEmploye[key]) {
        heuresByEmploye[key] = { nom: p.employe.nom, prenom: p.employe.prenom, heures: 0 }
      }
      heuresByEmploye[key].heures += p.heuresTravaillees
    }
  }
  const topEmployes = Object.values(heuresByEmploye)
    .sort((a, b) => b.heures - a.heures)
    .slice(0, 5)

  // Status breakdown
  const statutCounts: Record<string, number> = {}
  for (const p of pointages) {
    statutCounts[p.statut] = (statutCounts[p.statut] ?? 0) + 1
  }
  const repartitionStatuts = Object.entries(statutCounts).map(([statut, count]) => ({ statut, count }))

  return NextResponse.json({
    totalEmployes: employes,
    totalHeures,
    totalSalaires,
    moyenneHeures,
    tauxPresence,
    tauxAbsence,
    topEmployes,
    repartitionStatuts,
  })
}
