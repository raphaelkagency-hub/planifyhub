import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()

    const existing = await prisma.planning.findFirst({
      where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    })
    if (!existing) return NextResponse.json({ error: 'Planning non trouvé' }, { status: 404 })

    const updateData: any = {}
    if (body.date) updateData.date = new Date(body.date)
    if (body.heureDebut) updateData.heureDebut = body.heureDebut
    if (body.heureFin) updateData.heureFin = body.heureFin
    if (body.pauseDuree !== undefined) updateData.pauseDuree = body.pauseDuree
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.statut) updateData.statut = body.statut
    if (body.employeId !== undefined) updateData.employeId = body.employeId || null

    const planning = await prisma.planning.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      },
    })

    return NextResponse.json({ planning })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const existing = await prisma.planning.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
  })
  if (!existing) return NextResponse.json({ error: 'Planning non trouvé' }, { status: 404 })

  await prisma.planning.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
