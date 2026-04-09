import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const employeId = searchParams.get('employeId')

  const where: any = { entrepriseId: session!.user.entrepriseId }

  if (session!.user.role === 'EMPLOYE') {
    where.employeId = session!.user.id
  } else if (employeId) {
    where.employeId = employeId
  }

  if (start && end) {
    where.date = {
      gte: new Date(start),
      lte: new Date(end + 'T23:59:59'),
    }
  }

  const plannings = await prisma.planning.findMany({
    where,
    include: {
      employe: {
        select: { id: true, nom: true, prenom: true, poste: true },
      },
    },
    orderBy: [{ date: 'asc' }, { heureDebut: 'asc' }],
  })

  return NextResponse.json({ plannings })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const { employeId, date, heureDebut, heureFin, pauseDuree, notes, statut } = body

    if (!date || !heureDebut || !heureFin) {
      return NextResponse.json({ error: 'Date et heures obligatoires' }, { status: 400 })
    }

    // Verify employee belongs to same company
    if (employeId) {
      const emp = await prisma.employe.findFirst({
        where: { id: employeId, entrepriseId: session!.user.entrepriseId },
      })
      if (!emp) return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 })
    }

    const planning = await prisma.planning.create({
      data: {
        entrepriseId: session!.user.entrepriseId,
        employeId: employeId || null,
        date: new Date(date),
        heureDebut,
        heureFin,
        pauseDuree: pauseDuree ?? 60,
        notes: notes ?? null,
        statut: statut ?? 'PLANIFIE',
      },
      include: {
        employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      },
    })

    return NextResponse.json({ planning }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
