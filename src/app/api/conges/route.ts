import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'

function calculateWorkingDays(start: Date, end: Date, joursOuvres: string): number {
  const days = joursOuvres.split(',').map(Number)
  let count = 0
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(23, 59, 59, 999)
  while (current <= endDate) {
    // getDay() returns 0=Sunday, 1=Monday... joursOuvres uses 1=Monday..5=Friday (ISO)
    const dow = current.getDay() === 0 ? 7 : current.getDay()
    if (days.includes(dow)) count++
    current.setDate(current.getDate() + 1)
  }
  return count || 1
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut')
  const employeId = searchParams.get('employeId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'

  const where: Record<string, unknown> = {
    entrepriseId: session!.user.entrepriseId,
    ...(statut ? { statut } : {}),
    ...(isAdmin && employeId ? { employeId } : !isAdmin ? { employeId: session!.user.id } : {}),
    ...(from || to ? {
      dateDebut: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    } : {}),
  }

  const conges = await prisma.congeAbsence.findMany({
    where,
    include: {
      employe: { select: { nom: true, prenom: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ conges })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const { type, dateDebut, dateFin, motif, employeId } = body

  if (!type || !dateDebut || !dateFin) {
    return NextResponse.json({ error: 'Type, date début et date fin requis' }, { status: 400 })
  }

  const isAdmin = session!.user.role === 'DIRIGEANT' || session!.user.role === 'SECRETARIAT'
  const targetEmployeId = isAdmin && employeId ? employeId : session!.user.id

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: session!.user.entrepriseId },
    select: { joursOuvres: true }
  })

  const start = new Date(dateDebut)
  const end = new Date(dateFin)
  if (end < start) {
    return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
  }

  const nbJours = calculateWorkingDays(start, end, entreprise?.joursOuvres ?? '1,2,3,4,5')

  const conge = await prisma.congeAbsence.create({
    data: {
      entrepriseId: session!.user.entrepriseId,
      employeId: targetEmployeId,
      type,
      dateDebut: start,
      dateFin: end,
      nbJours,
      motif: motif || null,
      statut: 'EN_ATTENTE',
    },
    include: {
      employe: { select: { nom: true, prenom: true } }
    }
  })

  return NextResponse.json({ conge }, { status: 201 })
}
