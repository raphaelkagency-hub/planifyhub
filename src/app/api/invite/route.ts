import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import crypto from 'crypto'
import { sendEmail, emailSecretaryInvite } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  try {
    const { email, prenom, nom } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.invitationToken.create({
      data: {
        email,
        token,
        type: 'SECRETARY_INVITE',
        entrepriseId: session!.user.entrepriseId,
        entrepriseNom: session!.user.entrepriseNom,
        prenom: prenom || null,
        nom: nom || null,
        expiresAt,
      },
    })

    const emailContent = emailSecretaryInvite(
      email,
      token,
      session!.user.entrepriseNom ?? '',
      session!.user.name ?? 'Le dirigeant'
    )
    const result = await sendEmail(emailContent)

    const setupUrl = `${process.env.NEXTAUTH_URL}/setup/${token}`

    return NextResponse.json({
      success: true,
      emailSent: result.sent,
      setupUrl: result.sent ? null : setupUrl,
    })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
