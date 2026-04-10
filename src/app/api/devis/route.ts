import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { generateNumeroDevis, calculateLigne, calculateTotals } from '@/lib/facturation'

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const devis = await prisma.devis.findMany({
    where: { entrepriseId: session!.user.entrepriseId },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ devis })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const body = await req.json()
  const { clientId, objet, lignes = [], tauxTVA = 20, dateValidite, notes, conditionsPaiement } = body

  if (!clientId || !objet) {
    return NextResponse.json({ error: 'Client et objet requis' }, { status: 400 })
  }

  const processedLignes = (lignes as { description: string; quantite: number; prixUnitaire: number; taux?: number; ordre?: number }[]).map((l, i) => ({
    ...l,
    taux: l.taux ?? tauxTVA,
    ordre: l.ordre ?? i,
    montantHT: calculateLigne(l.quantite, l.prixUnitaire),
  }))

  const totals = calculateTotals(processedLignes, tauxTVA)
  const numero = await generateNumeroDevis(session!.user.entrepriseId)

  const devis = await prisma.devis.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      clientId, objet, numero,
      tauxTVA, ...totals,
      dateValidite: dateValidite ? new Date(dateValidite) : null,
      notes, conditionsPaiement,
      lignes: { create: processedLignes },
    },
    include: { client: { select: { nom: true } }, lignes: true }
  })

  return NextResponse.json({ devis }, { status: 201 })
}
