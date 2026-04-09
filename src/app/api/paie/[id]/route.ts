import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, requireAuth } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const where: any = { id: params.id, entrepriseId: session!.user.entrepriseId }
  if (session!.user.role === 'EMPLOYE') where.employeId = session!.user.id

  const paie = await prisma.paie.findFirst({
    where,
    include: {
      employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      entreprise: { select: { nom: true, type: true, siret: true, adresse: true } },
    },
  })

  if (!paie) return NextResponse.json({ error: 'Fiche de paie non trouvée' }, { status: 404 })

  return NextResponse.json({ paie })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const existing = await prisma.paie.findFirst({
      where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    })
    if (!existing) return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 })

    const updateData: any = {}
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.primes !== undefined) updateData.primes = body.primes
    if (body.retenues !== undefined) updateData.retenues = body.retenues

    // Validation / acceptation de la fiche
    if (body.valide !== undefined) {
      updateData.valide = body.valide
      updateData.valideePar = body.valide ? session!.user.id : null
      updateData.valideeAt = body.valide ? new Date() : null
    }

    const paie = await prisma.paie.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      },
    })

    return NextResponse.json({ paie })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const existing = await prisma.paie.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
  })
  if (!existing) return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 })

  await prisma.paie.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
