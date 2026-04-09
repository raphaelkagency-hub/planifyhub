import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

function calcHeures(arrivee: string, depart: string, pauseDuree: number): number {
  const [ah, am] = arrivee.split(':').map(Number)
  const [dh, dm] = depart.split(':').map(Number)
  const totalMinutes = (dh * 60 + dm) - (ah * 60 + am) - pauseDuree
  return Math.max(0, totalMinutes / 60)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const body = await req.json()

    const existing = await prisma.pointage.findFirst({
      where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    })
    if (!existing) return NextResponse.json({ error: 'Pointage non trouvé' }, { status: 404 })

    if (session!.user.role === 'EMPLOYE' && existing.employeId !== session!.user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const updateData: any = {}

    if (body.heureArrivee !== undefined) updateData.heureArrivee = body.heureArrivee || null
    if (body.heureDepart !== undefined) updateData.heureDepart = body.heureDepart || null
    if (body.pauseDuree !== undefined) updateData.pauseDuree = body.pauseDuree
    if (body.statut) updateData.statut = body.statut
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.valide !== undefined && session!.user.role !== 'EMPLOYE') {
      updateData.valide = body.valide
    }

    // Recalculate hours if both times present
    const arrivee = updateData.heureArrivee !== undefined ? updateData.heureArrivee : existing.heureArrivee
    const depart = updateData.heureDepart !== undefined ? updateData.heureDepart : existing.heureDepart
    const pause = updateData.pauseDuree !== undefined ? updateData.pauseDuree : existing.pauseDuree

    if (arrivee && depart) {
      updateData.heuresTravaillees = calcHeures(arrivee, depart, pause)
    }

    const pointage = await prisma.pointage.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      },
    })

    return NextResponse.json({ pointage })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  if (session!.user.role === 'EMPLOYE') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const existing = await prisma.pointage.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
  })
  if (!existing) return NextResponse.json({ error: 'Pointage non trouvé' }, { status: 404 })

  await prisma.pointage.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
