import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { generateNumeroFacture } from '@/lib/facturation'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const devis = await prisma.devis.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { lignes: true }
  })
  if (!devis) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  if (devis.statut === 'CONVERTI') {
    return NextResponse.json({ error: 'Ce devis a déjà été converti' }, { status: 400 })
  }

  const numero = await generateNumeroFacture(session!.user.entrepriseId)

  const facture = await prisma.facture.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      clientId: devis.clientId,
      devisId: devis.id,
      numero,
      objet: devis.objet,
      statut: 'BROUILLON',
      montantHT: devis.montantHT,
      tauxTVA: devis.tauxTVA,
      montantTVA: devis.montantTVA,
      montantTTC: devis.montantTTC,
      notes: devis.notes,
      conditionsPaiement: devis.conditionsPaiement,
      lignes: {
        create: devis.lignes.map(l => ({
          description: l.description,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          taux: l.taux,
          montantHT: l.montantHT,
          ordre: l.ordre,
        }))
      }
    }
  })

  await prisma.devis.update({
    where: { id: devis.id },
    data: { statut: 'CONVERTI', convertedToFactureId: facture.id }
  })

  return NextResponse.json({ factureId: facture.id }, { status: 201 })
}
