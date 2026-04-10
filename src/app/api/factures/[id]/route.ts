import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { calculateLigne, calculateTotals } from '@/lib/facturation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const facture = await prisma.facture.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { client: true, lignes: { orderBy: { ordre: 'asc' } } }
  })
  if (!facture) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json({ facture })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const facture = await prisma.facture.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!facture) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  const body = await req.json()

  let updateData: Record<string, unknown> = {
    objet: body.objet ?? facture.objet,
    statut: body.statut ?? facture.statut,
    notes: body.notes ?? facture.notes,
    conditionsPaiement: body.conditionsPaiement ?? facture.conditionsPaiement,
    modePaiement: body.modePaiement ?? facture.modePaiement,
    dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : facture.dateEcheance,
    datePaiement: body.datePaiement ? new Date(body.datePaiement) : facture.datePaiement,
  }

  if (body.lignes) {
    const processedLignes = (body.lignes as { description: string; quantite: number; prixUnitaire: number; taux?: number; ordre?: number }[]).map((l, i) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      taux: l.taux ?? facture.tauxTVA,
      ordre: l.ordre ?? i,
      montantHT: calculateLigne(l.quantite, l.prixUnitaire),
    }))
    const totals = calculateTotals(processedLignes, body.tauxTVA ?? facture.tauxTVA)
    updateData = { ...updateData, ...totals, tauxTVA: body.tauxTVA ?? facture.tauxTVA }

    await prisma.factureLigne.deleteMany({ where: { factureId: params.id } })
    await prisma.factureLigne.createMany({ data: processedLignes.map(l => ({ ...l, factureId: params.id })) })
  }

  const updated = await prisma.facture.update({
    where: { id: params.id },
    data: updateData,
    include: { client: true, lignes: { orderBy: { ordre: 'asc' } } }
  })

  return NextResponse.json({ facture: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  const facture = await prisma.facture.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!facture) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  await prisma.facture.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
