import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const periode = searchParams.get('periode')
  const employeId = searchParams.get('employeId')

  const where: any = { entrepriseId: session!.user.entrepriseId }

  if (session!.user.role === 'EMPLOYE') {
    where.employeId = session!.user.id
  } else if (employeId) {
    where.employeId = employeId
  }

  if (periode) {
    where.periode = periode
  }

  const paies = await prisma.paie.findMany({
    where,
    include: {
      employe: {
        select: { id: true, nom: true, prenom: true, poste: true },
      },
    },
    orderBy: [{ periode: 'desc' }, { employe: { nom: 'asc' } }],
  })

  return NextResponse.json({ paies })
}
