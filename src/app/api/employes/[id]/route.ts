import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth()
  if (error) return error

  const employe = await prisma.employe.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    select: {
      id: true, email: true, nom: true, prenom: true, role: true,
      poste: true, tauxHoraire: true, telephone: true, dateEmbauche: true, actif: true,
    },
  })

  if (!employe) return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })

  return NextResponse.json({ employe })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const { password, ...rest } = body

    // Verify belongs to same company
    const existing = await prisma.employe.findFirst({
      where: { id: params.id, entrepriseId: session!.user.entrepriseId },
    })
    if (!existing) return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })

    const updateData: any = { ...rest }
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }
    if (rest.role) updateData.role = rest.role as string
    if (rest.dateEmbauche) updateData.dateEmbauche = new Date(rest.dateEmbauche)

    const employe = await prisma.employe.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true, email: true, nom: true, prenom: true, role: true,
        poste: true, tauxHoraire: true, telephone: true, dateEmbauche: true, actif: true,
      },
    })

    return NextResponse.json({ employe })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  const existing = await prisma.employe.findFirst({
    where: { id: params.id, entrepriseId: session!.user.entrepriseId },
  })
  if (!existing) return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })

  // Protect: can't delete yourself
  if (params.id === session!.user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
  }

  await prisma.employe.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
