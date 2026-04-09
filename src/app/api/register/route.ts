import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entrepriseNom, entrepriseType, siret, prenom, nom, email, password } = body

    if (!entrepriseNom || !prenom || !nom || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const existingUser = await prisma.employe.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    // Créer l'entreprise
    const entreprise = await prisma.entreprise.create({
      data: {
        nom: entrepriseNom,
        type: entrepriseType ?? 'SARL',
        siret: siret ?? null,
        abonnement: 'PRO',
      },
    })

    // Créer le compte dirigeant directement
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.employe.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: 'DIRIGEANT',
        entrepriseId: entreprise.id,
        passwordDefinedBy: 'self',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }
}
