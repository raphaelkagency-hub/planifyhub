import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const document = await prisma.document.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    include: { employe: { select: { nom: true, prenom: true } } }
  })
  if (!document) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json({ document })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'
  const document = await prisma.document.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!document) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  if (!isAdmin && document.uploadePar !== session!.user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.document.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
