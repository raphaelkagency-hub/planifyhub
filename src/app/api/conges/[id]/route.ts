import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const conge = await prisma.congeAbsence.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { employe: { select: { nom: true, prenom: true, email: true } } }
  })
  if (!conge) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json({ conge })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'

  const conge = await prisma.congeAbsence.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { employe: { select: { email: true, prenom: true, nom: true } } }
  })
  if (!conge) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  if (isAdmin && body.statut) {
    // Admin approves/refuses
    const updated = await prisma.congeAbsence.update({
      where: { id: params.id },
      data: {
        statut: body.statut,
        commentaire: body.commentaire ?? null,
        approvePar: session!.user.id,
        approveAt: new Date(),
      }
    })

    // Send notification email (fire and forget)
    try {
      const { sendEmail } = await import('@/lib/email')
      const action = body.statut === 'APPROUVE' ? 'approuvée ✅' : 'refusée ❌'
      await sendEmail({
        to: conge.employe.email,
        subject: `Votre demande de congé a été ${action}`,
        html: `<p>Bonjour ${conge.employe.prenom},</p><p>Votre demande de congé (${conge.type}) du ${new Date(conge.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(conge.dateFin).toLocaleDateString('fr-FR')} a été <strong>${action}</strong>.</p>${body.commentaire ? `<p>Commentaire : ${body.commentaire}</p>` : ''}`
      })
    } catch {}

    return NextResponse.json({ conge: updated })
  }

  // Employee can only update EN_ATTENTE requests
  if (conge.employeId !== session!.user.id || conge.statut !== 'EN_ATTENTE') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const updated = await prisma.congeAbsence.update({
    where: { id: params.id },
    data: {
      motif: body.motif ?? conge.motif,
    }
  })
  return NextResponse.json({ conge: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'
  const conge = await prisma.congeAbsence.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!conge) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  if (!isAdmin && (conge.employeId !== session!.user.id || conge.statut !== 'EN_ATTENTE')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.congeAbsence.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
