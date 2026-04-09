import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'
import { Abonnement } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: session!.user.entrepriseId },
    select: {
      abonnement: true,
      stripeCustomerId: true,
      stripeSubId: true,
      stripeStatus: true,
    },
  })

  if (!entreprise) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })

  return NextResponse.json(entreprise)
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  try {
    const body = await req.json()
    const { abonnement } = body

    if (!['BASIQUE', 'STANDARD', 'PREMIUM'].includes(abonnement)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const entreprise = await prisma.entreprise.update({
      where: { id: session!.user.entrepriseId },
      data: {
        abonnement: abonnement as Abonnement,
        stripeStatus: 'active',
      },
    })

    return NextResponse.json({ abonnement: entreprise.abonnement })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
