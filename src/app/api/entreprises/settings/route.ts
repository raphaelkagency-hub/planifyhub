import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: session!.user.entrepriseId },
    select: {
      id: true, nom: true, type: true, siret: true, adresse: true,
      codePostal: true, ville: true, telephone: true, email: true,
      siteWeb: true, heureDebut: true, heureFin: true, pauseDuree: true,
      joursOuvres: true, abonnement: true,
      horairesDebutConfig: true,
      heuresContractuelles: true,
      heuresSupPayees: true,
      tauxHeuresSuppMultiplier: true,
      emailProvider: true, emailSmtpHost: true, emailSmtpPort: true,
      emailSmtpUser: true, emailSmtpSecure: true,
    },
  })

  if (!entreprise) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })

  return NextResponse.json({ entreprise })
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT', 'SECRETARIAT'])
  if (error) return error

  try {
    const body = await req.json()
    const {
      nom, type, siret, adresse, codePostal, ville, telephone, email,
      siteWeb, heureDebut, heureFin, pauseDuree, joursOuvres,
      horairesDebutConfig, heuresContractuelles, heuresSupPayees, tauxHeuresSuppMultiplier,
      emailProvider, emailSmtpHost, emailSmtpPort, emailSmtpUser, emailSmtpPass, emailSmtpSecure,
    } = body

    // Only DIRIGEANT can change company info and overtime settings
    const isDirigeant = session!.user.role === 'DIRIGEANT'

    const updateData: any = {
      heureDebut: heureDebut ?? undefined,
      heureFin: heureFin ?? undefined,
      pauseDuree: pauseDuree ?? undefined,
      joursOuvres: joursOuvres ?? undefined,
      horairesDebutConfig: horairesDebutConfig ?? undefined,
    }

    if (isDirigeant) {
      if (nom !== undefined) updateData.nom = nom
      if (type !== undefined) updateData.type = type
      if (siret !== undefined) updateData.siret = siret
      if (adresse !== undefined) updateData.adresse = adresse
      if (codePostal !== undefined) updateData.codePostal = codePostal
      if (ville !== undefined) updateData.ville = ville
      if (telephone !== undefined) updateData.telephone = telephone
      if (email !== undefined) updateData.email = email
      if (siteWeb !== undefined) updateData.siteWeb = siteWeb
      if (heuresContractuelles !== undefined) updateData.heuresContractuelles = parseInt(heuresContractuelles)
      if (heuresSupPayees !== undefined) updateData.heuresSupPayees = heuresSupPayees
      if (tauxHeuresSuppMultiplier !== undefined) updateData.tauxHeuresSuppMultiplier = parseFloat(tauxHeuresSuppMultiplier)
      if (emailProvider !== undefined) updateData.emailProvider = emailProvider
      if (emailSmtpHost !== undefined) updateData.emailSmtpHost = emailSmtpHost
      if (emailSmtpPort !== undefined) updateData.emailSmtpPort = emailSmtpPort
      if (emailSmtpUser !== undefined) updateData.emailSmtpUser = emailSmtpUser
      if (emailSmtpPass !== undefined) updateData.emailSmtpPass = emailSmtpPass
      if (emailSmtpSecure !== undefined) updateData.emailSmtpSecure = emailSmtpSecure
    } else {
      // Secrétariat can update heuresContractuelles too
      if (heuresContractuelles !== undefined) updateData.heuresContractuelles = parseInt(heuresContractuelles)
    }

    const entreprise = await prisma.entreprise.update({
      where: { id: session!.user.entrepriseId },
      data: updateData,
    })

    return NextResponse.json({ entreprise })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
