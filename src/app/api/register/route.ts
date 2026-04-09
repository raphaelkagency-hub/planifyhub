import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail, emailRegistrationToken } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entrepriseNom, entrepriseType, siret, prenom, nom, email } = body

    if (!entrepriseNom || !prenom || !nom || !email) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 })
    }

    const existingUser = await prisma.employe.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    // Create the entreprise first
    const entreprise = await prisma.entreprise.create({
      data: {
        nom: entrepriseNom,
        type: entrepriseType ?? 'SARL',
        siret: siret ?? null,
        abonnement: 'PRO',
      },
    })

    // Create invitation token (24h)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.invitationToken.create({
      data: {
        email,
        token,
        type: 'REGISTRATION',
        entrepriseId: entreprise.id,
        entrepriseNom,
        prenom,
        nom,
        expiresAt,
      },
    })

    // Try to send email
    const emailContent = emailRegistrationToken(email, token, entrepriseNom)
    const result = await sendEmail(emailContent)

    const setupUrl = `${process.env.NEXTAUTH_URL}/setup/${token}`

    return NextResponse.json({
      success: true,
      emailSent: result.sent,
      // Return setup URL for dev mode (no SMTP configured)
      setupUrl: result.sent ? null : setupUrl,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }
}
