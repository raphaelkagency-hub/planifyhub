import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeId = searchParams.get('employeId')
  const type = searchParams.get('type')
  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'

  const documents = await prisma.document.findMany({
    where: {
      entrepriseId: session!.user.entrepriseId,
      ...(type ? { type } : {}),
      ...(isAdmin && employeId ? { employeId } : !isAdmin ? { employeId: session!.user.id } : {}),
    },
    include: {
      employe: { select: { nom: true, prenom: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const { nom, type, fichierUrl, taille, mimeType, employeId } = body

  if (!nom || !fichierUrl) {
    return NextResponse.json({ error: 'Nom et URL du fichier requis' }, { status: 400 })
  }

  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'

  const document = await prisma.document.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      employeId: isAdmin && employeId ? employeId : session!.user.id,
      nom,
      type: type || 'AUTRE',
      fichierUrl,
      taille: taille || null,
      mimeType: mimeType || null,
      uploadePar: session!.user.id,
    }
  })

  return NextResponse.json({ document }, { status: 201 })
}
