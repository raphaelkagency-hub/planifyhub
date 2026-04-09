import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const { employeId, periode } = body

    if (!periode) {
      return NextResponse.json({ error: 'Période obligatoire (format YYYY-MM)' }, { status: 400 })
    }

    // Get entreprise settings for overtime
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: session!.user.entrepriseId },
      select: { heuresContractuelles: true, heuresSupPayees: true, tauxHeuresSuppMultiplier: true },
    })
    const heuresSupPayees = entreprise?.heuresSupPayees ?? true
    const multiplier = entreprise?.tauxHeuresSuppMultiplier ?? 1.25

    const employeWhere: any = { entrepriseId: session!.user.entrepriseId, actif: true }
    if (employeId) employeWhere.id = employeId

    const employes = await prisma.employe.findMany({ where: employeWhere })

    const [year, month] = periode.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const generatedPaies = []

    for (const emp of employes) {
      const pointages = await prisma.pointage.findMany({
        where: {
          employeId: emp.id,
          date: { gte: startDate, lte: endDate },
          statut: 'PRESENT',
        },
        select: { heuresTravaillees: true, heuresSupp: true },
      })

      const heuresTravaillees = pointages.reduce((sum, p) => sum + (p.heuresTravaillees ?? 0), 0)
      // Use stored heuresSupp from pointage (calculated per week based on contract)
      const heuresSupp = pointages.reduce((sum, p) => sum + (p.heuresSupp ?? 0), 0)
      const heuresNormales = heuresTravaillees - heuresSupp

      // If heuresSupPayees disabled, overtime is tracked but NOT added to salary
      const salaireBrut = heuresSupPayees
        ? (heuresNormales * emp.tauxHoraire) + (heuresSupp * emp.tauxHoraire * multiplier)
        : heuresTravaillees * emp.tauxHoraire

      const cotisationsSalariales = salaireBrut * 0.22
      const cotisationsPatronales = salaireBrut * 0.42
      const salaireNet = salaireBrut - cotisationsSalariales

      const paie = await prisma.paie.upsert({
        where: { employeId_periode: { employeId: emp.id, periode } },
        update: {
          heuresTravaillees,
          heuresSupp,
          tauxHoraire: emp.tauxHoraire,
          tauxHeuresSupp: heuresSupPayees ? multiplier : 0,
          salaireBrut,
          cotisationsSalariales,
          cotisationsPatronales,
          salaireNet,
          genereAt: new Date(),
        },
        create: {
          entrepriseId: session!.user.entrepriseId,
          employeId: emp.id,
          periode,
          heuresTravaillees,
          heuresSupp,
          tauxHoraire: emp.tauxHoraire,
          tauxHeuresSupp: heuresSupPayees ? multiplier : 0,
          salaireBrut,
          cotisationsSalariales,
          cotisationsPatronales,
          salaireNet,
        },
        include: {
          employe: { select: { id: true, nom: true, prenom: true, poste: true } },
        },
      })

      generatedPaies.push(paie)
    }

    return NextResponse.json({ paies: generatedPaies, count: generatedPaies.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
