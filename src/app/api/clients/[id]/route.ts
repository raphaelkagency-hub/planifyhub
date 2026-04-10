import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const client = await prisma.client.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!client) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json({ client })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  const body = await req.json()
  const client = await prisma.client.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!client) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  const updated = await prisma.client.update({
    where: { id: params.id },
    data: {
      nom: body.nom ?? client.nom,
      email: body.email ?? client.email,
      telephone: body.telephone ?? client.telephone,
      adresse: body.adresse ?? client.adresse,
      codePostal: body.codePostal ?? client.codePostal,
      ville: body.ville ?? client.ville,
      siret: body.siret ?? client.siret,
      tvaNumero: body.tvaNumero ?? client.tvaNumero,
      notes: body.notes ?? client.notes,
      actif: body.actif ?? client.actif,
    }
  })
  return NextResponse.json({ client: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  const client = await prisma.client.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId }
  })
  if (!client) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  // Soft delete
  await prisma.client.update({ where: { id: params.id }, data: { actif: false } })
  return NextResponse.json({ success: true })
}
