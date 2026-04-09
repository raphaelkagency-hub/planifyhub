import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { hasFeature } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const abonnement = session!.user.abonnement as any
  if (!hasFeature(abonnement, 'chatLectureSeule') && !hasFeature(abonnement, 'messagerie')) {
    return NextResponse.json({ error: 'Fonctionnalité non disponible avec votre abonnement' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const messages = await prisma.chatMessage.findMany({
    where: { entrepriseId: session!.user.entrepriseId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  if (session!.user.role === 'EMPLOYE') {
    return NextResponse.json({ error: 'Les employés ne peuvent pas envoyer de messages' }, { status: 403 })
  }

  const abonnement = session!.user.abonnement as any
  if (!hasFeature(abonnement, 'messagerie') && !hasFeature(abonnement, 'chatLectureSeule')) {
    return NextResponse.json({ error: 'Fonctionnalité non disponible avec votre abonnement' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { contenu, type } = body

    if (!contenu?.trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    if (contenu.length > 500) {
      return NextResponse.json({ error: 'Message trop long (max 500 caractères)' }, { status: 400 })
    }

    const message = await prisma.chatMessage.create({
      data: {
        entrepriseId: session!.user.entrepriseId,
        auteurId: session!.user.id,
        auteurNom: session!.user.name ?? 'Inconnu',
        auteurRole: session!.user.role,
        contenu: contenu.trim(),
        type: type ?? 'TEXT',
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
