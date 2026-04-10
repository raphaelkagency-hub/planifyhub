import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { calculateLigne, calculateTotals } from '@/lib/facturation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const devis = await prisma.devis.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { client: true, lignes: { orderBy: { ordre: 'asc' } } }
  })
  if (!devis) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json({ devis })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const devis = await prisma.devis.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!devis) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  const body = await req.json()

  let updateData: Record<string, unknown> = {
    objet: body.objet ?? devis.objet,
    statut: body.statut ?? devis.statut,
    notes: body.notes ?? devis.notes,
    conditionsPaiement: body.conditionsPaiement ?? devis.conditionsPaiement,
    dateValidite: body.dateValidite ? new Date(body.dateValidite) : devis.dateValidite,
  }

  if (body.lignes) {
    const processedLignes = (body.lignes as { description: string; quantite: number; prixUnitaire: number; taux?: number; ordre?: number }[]).map((l, i) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      taux: l.taux ?? devis.tauxTVA,
      ordre: l.ordre ?? i,
      montantHT: calculateLigne(l.quantite, l.prixUnitaire),
    }))
    const totals = calculateTotals(processedLignes, body.tauxTVA ?? devis.tauxTVA)
    updateData = { ...updateData, ...totals, tauxTVA: body.tauxTVA ?? devis.tauxTVA }

    await prisma.devisLigne.deleteMany({ where: { devisId: params.id } })
    await prisma.devisLigne.createMany({ data: processedLignes.map(l => ({ ...l, devisId: params.id })) })
  }

  const updated = await prisma.devis.update({
    where: { id: params.id },
    data: updateData,
    include: { client: true, lignes: { orderBy: { ordre: 'asc' } } }
  })

  return NextResponse.json({ devis: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  const devis = await prisma.devis.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!devis) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  await prisma.devis.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
