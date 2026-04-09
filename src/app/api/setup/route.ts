import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Token et mot de passe (min 8 caractères) requis' }, { status: 400 })
    }

    const invitation = await prisma.invitationToken.findUnique({ where: { token } })

    if (!invitation) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })
    }
    if (invitation.used) {
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 400 })
    }
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Ce lien a expiré (24h)' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    if (invitation.type === 'REGISTRATION') {
      // Create the dirigeant account
      const existingUser = await prisma.employe.findUnique({ where: { email: invitation.email } })
      if (existingUser) {
        return NextResponse.json({ error: 'Ce compte existe déjà. Connectez-vous.' }, { status: 400 })
      }

      await prisma.employe.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          nom: invitation.nom ?? '',
          prenom: invitation.prenom ?? '',
          role: 'DIRIGEANT',
          poste: 'Dirigeant',
          entrepriseId: invitation.entrepriseId!,
          passwordDefinedBy: 'self',
        },
      })
    } else if (invitation.type === 'SECRETARY_INVITE') {
      const existingUser = await prisma.employe.findUnique({ where: { email: invitation.email } })
      if (existingUser) {
        // Update password if account already exists (re-invite case)
        await prisma.employe.update({
          where: { email: invitation.email },
          data: { password: hashedPassword, actif: true },
        })
      } else {
        await prisma.employe.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            nom: invitation.nom ?? '',
            prenom: invitation.prenom ?? '',
            role: 'SECRETARIAT',
            poste: 'Secrétaire',
            entrepriseId: invitation.entrepriseId!,
            passwordDefinedBy: 'self',
          },
        })
      }
    }

    // Mark token as used
    await prisma.invitationToken.update({
      where: { token },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const invitation = await prisma.invitationToken.findUnique({ where: { token } })

  if (!invitation || invitation.used || new Date() > invitation.expiresAt) {
    return NextResponse.json({ valid: false, reason: invitation?.used ? 'used' : 'expired' })
  }

  return NextResponse.json({
    valid: true,
    email: invitation.email,
    prenom: invitation.prenom,
    entrepriseNom: invitation.entrepriseNom,
    type: invitation.type,
  })
}
