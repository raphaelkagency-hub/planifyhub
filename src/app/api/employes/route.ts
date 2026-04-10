import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { sendEmail, emailEmployeeCredentials } from '@/lib/email'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const employes = await prisma.employe.findMany({
    where: { entrepriseId: session!.user.entrepriseId },
    select: {
      id: true, email: true, nom: true, prenom: true, role: true,
      poste: true, tauxHoraire: true, telephone: true, dateEmbauche: true,
      actif: true, heuresContractuelles: true,
    },
    orderBy: [{ role: 'asc' }, { nom: 'asc' }],
  })

  return NextResponse.json({ employes })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const { email, password, nom, prenom, role, poste, tauxHoraire, telephone, dateEmbauche, heuresContractuelles } = body

    if (!email || !password || !nom || !prenom) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, { status: 400 })
    }

    // Secrétariat can only create EMPLOYE accounts
    if (session!.user.role === 'SECRETARIAT' && role && role !== 'EMPLOYE') {
      return NextResponse.json({ error: 'Le secrétariat ne peut créer que des comptes employé' }, { status: 403 })
    }

    const existing = await prisma.employe.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 })
    }

    // Vérifier limite d'employés selon le plan
    const entreprisePlan = await prisma.entreprise.findUnique({
      where: { id: session!.user.entrepriseId },
      select: { abonnement: true }
    })
    const employeCount = await prisma.employe.count({
      where: { entrepriseId: session!.user.entrepriseId }
    })
    const { canAddEmploye } = await import('@/lib/subscription')
    if (!canAddEmploye(entreprisePlan?.abonnement ?? 'STARTER', employeCount)) {
      return NextResponse.json(
        { error: "Limite d'employés atteinte pour votre abonnement. Passez au plan supérieur." },
        { status: 403 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: session!.user.entrepriseId },
      select: { nom: true },
    })

    const employe = await prisma.employe.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: role ?? 'EMPLOYE',
        poste: poste ?? null,
        tauxHoraire: tauxHoraire ?? 15,
        telephone: telephone ?? null,
        dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null,
        heuresContractuelles: heuresContractuelles ? parseInt(heuresContractuelles) : null,
        entrepriseId: session!.user.entrepriseId,
        passwordDefinedBy: 'admin',
      },
    })

    // Send credentials by email (fire and forget)
    const emailContent = emailEmployeeCredentials(email, password, prenom, entreprise?.nom ?? '')
    sendEmail(emailContent).catch(console.error)

    const { password: _, ...employeSafe } = employe
    return NextResponse.json({
      employe: employeSafe,
      emailSent: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
