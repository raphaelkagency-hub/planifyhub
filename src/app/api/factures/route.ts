import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { generateNumeroFacture, calculateLigne, calculateTotals } from '@/lib/facturation'

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const factures = await prisma.facture.findMany({
    where: { entrepriseId: session!.user.entrepriseId },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { createdAt: 'desc' },
  })

  // Stats
  const totalCA = factures
    .filter(f => f.statut === 'PAYEE')
    .reduce((sum, f) => sum + f.montantTTC, 0)
  const totalImpayes = factures
    .filter(f => f.statut === 'ENVOYEE' || f.statut === 'EN_RETARD')
    .reduce((sum, f) => sum + f.montantTTC, 0)

  return NextResponse.json({ factures, stats: { totalCA, totalImpayes } })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const body = await req.json()
  const { clientId, objet, lignes = [], tauxTVA = 20, dateEcheance, notes, conditionsPaiement, modePaiement } = body

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
  const numero = await generateNumeroFacture(session!.user.entrepriseId)

  const facture = await prisma.facture.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      clientId, objet, numero,
      tauxTVA, ...totals,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
      notes, conditionsPaiement, modePaiement,
      lignes: { create: processedLignes },
    },
    include: { client: { select: { nom: true } }, lignes: true }
  })

  return NextResponse.json({ facture }, { status: 201 })
}
