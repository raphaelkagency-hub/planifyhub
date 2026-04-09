import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'

function calcHeures(arrivee: string, depart: string, pauseDuree: number): number {
  // arrivee/depart are "HH:mm" strings
  const [ah, am] = arrivee.split(':').map(Number)
  const [dh, dm] = depart.split(':').map(Number)
  const totalMinutes = (dh * 60 + dm) - (ah * 60 + am) - pauseDuree
  return Math.max(0, totalMinutes / 60)
}

function calcHeuresSupp(heuresTravaillees: number, heuresContractuelles: number, heuresDejaFaitesSemaine: number): number {
  // Weekly overtime: hours above contractual hours per week
  // We accumulate: if (existing + today) > contract → overtime on excess
  const total = heuresDejaFaitesSemaine + heuresTravaillees
  const supp = Math.max(0, total - heuresContractuelles)
  const suppDeja = Math.max(0, heuresDejaFaitesSemaine - heuresContractuelles)
  return Math.max(0, supp - suppDeja)
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const employeId = searchParams.get('employeId')

  const where: any = { entrepriseId: session!.user.entrepriseId }

  if (session!.user.role === 'EMPLOYE') {
    where.employeId = session!.user.id
  } else if (employeId) {
    where.employeId = employeId
  }

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.date = { gte: start, lte: end }
  } else if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59'),
    }
  }

  const pointages = await prisma.pointage.findMany({
    where,
    include: {
      employe: {
        select: { id: true, nom: true, prenom: true, poste: true },
      },
    },
    orderBy: [{ date: 'desc' }, { heureArrivee: 'desc' }],
  })

  return NextResponse.json({ pointages })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const body = await req.json()
    const { employeId, date, heureArrivee, heureDepart, pauseDuree, statut, notes } = body

    const targetEmployeId = session!.user.role === 'EMPLOYE'
      ? session!.user.id
      : (employeId ?? session!.user.id)

    if (!date) {
      return NextResponse.json({ error: 'Date obligatoire' }, { status: 400 })
    }

    // Employees can fill for today or past dates (not future)
    if (session!.user.role === 'EMPLOYE') {
      const targetDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (targetDate > today) {
        return NextResponse.json({ error: 'Impossible de pointer une date future' }, { status: 400 })
      }
    }

    // Calculate hours worked
    let heuresTravaillees: number | undefined
    let heuresSupp = 0
    if (heureArrivee && heureDepart) {
      heuresTravaillees = calcHeures(heureArrivee, heureDepart, pauseDuree ?? 0)

      // Get employee contract hours and weekly hours already worked
      const employe = await prisma.employe.findUnique({
        where: { id: targetEmployeId },
        include: { entreprise: { select: { heuresContractuelles: true } } },
      })
      const heuresContrat = employe?.heuresContractuelles ?? employe?.entreprise.heuresContractuelles ?? 35

      // Get start of week for the date
      const targetDate = new Date(date)
      const dayOfWeek = targetDate.getDay() || 7 // Mon=1..Sun=7
      const startOfWeek = new Date(targetDate)
      startOfWeek.setDate(targetDate.getDate() - dayOfWeek + 1)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const weekPointages = await prisma.pointage.findMany({
        where: {
          employeId: targetEmployeId,
          date: { gte: startOfWeek, lte: endOfWeek },
        },
        select: { heuresTravaillees: true },
      })
      const heuresDejaFaites = weekPointages.reduce((sum, p) => sum + (p.heuresTravaillees ?? 0), 0)
      heuresSupp = calcHeuresSupp(heuresTravaillees, heuresContrat, heuresDejaFaites)
    }

    const pointage = await prisma.pointage.create({
      data: {
        entrepriseId: session!.user.entrepriseId,
        employeId: targetEmployeId,
        date: new Date(date),
        heureArrivee: heureArrivee ?? null,
        heureDepart: heureDepart ?? null,
        pauseDuree: pauseDuree ?? 0,
        statut: statut ?? 'PRESENT',
        notes: notes ?? null,
        heuresTravaillees,
        heuresSupp,
      },
      include: {
        employe: { select: { id: true, nom: true, prenom: true, poste: true } },
      },
    })

    return NextResponse.json({ pointage }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
