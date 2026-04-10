import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const clients = await prisma.client.findMany({
    where: { entrepriseId: session!.user.entrepriseId, actif: true },
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const body = await req.json()
  const { nom, email, telephone, adresse, codePostal, ville, siret, tvaNumero, notes } = body
  if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const client = await prisma.client.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      nom, email, telephone, adresse, codePostal, ville, siret, tvaNumero, notes
    }
  })
  return NextResponse.json({ client }, { status: 201 })
}
