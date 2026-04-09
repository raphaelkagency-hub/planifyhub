import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Appeler GET /api/init pour créer les comptes de test
export async function GET(req: NextRequest) {
  try {
    const entreprise = await prisma.entreprise.upsert({
      where: { id: 'entreprise-test-001' },
      update: { abonnement: 'PRO', horairesDebutConfig: '08:00,08:30,09:00,09:30,10:00', heuresContractuelles: 35, heuresSupPayees: true, tauxHeuresSuppMultiplier: 1.25 },
      create: {
        id: 'entreprise-test-001',
        nom: 'Entreprise Démo SaaS',
        type: 'SARL',
        siret: '12345678901234',
        adresse: '123 Rue de la Paix',
        codePostal: '75001',
        ville: 'Paris',
        telephone: '0123456789',
        email: 'contact@entreprise-demo.fr',
        abonnement: 'PRO',
        heureDebut: '09:00',
        heureFin: '18:00',
        pauseDuree: 60,
        joursOuvres: '1,2,3,4,5',
        horairesDebutConfig: '08:00,08:30,09:00,09:30,10:00',
        heuresContractuelles: 35,
        heuresSupPayees: true,
        tauxHeuresSuppMultiplier: 1.25,
      },
    })

    const accounts = [
      { email: 'test.dirigeant@entreprise.com', password: 'Dirigeant123!', prenom: 'Jean', nom: 'Martin', role: 'DIRIGEANT', poste: 'Directeur Général', tauxHoraire: 50 },
      { email: 'test.secretaire@entreprise.com', password: 'Secretaire123!', prenom: 'Marie', nom: 'Dupont', role: 'SECRETARIAT', poste: 'Assistante de Direction', tauxHoraire: 22 },
      { email: 'test.employe@entreprise.com', password: 'Employe123!', prenom: 'Pierre', nom: 'Bernard', role: 'EMPLOYE', poste: 'Technicien', tauxHoraire: 17.5 },
    ]

    const created = []
    for (const account of accounts) {
      const hashed = await bcrypt.hash(account.password, 12)
      const emp = await prisma.employe.upsert({
        where: { email: account.email },
        update: { password: hashed },
        create: { ...account, password: hashed, entrepriseId: entreprise.id, dateEmbauche: new Date('2023-01-01'), passwordDefinedBy: 'admin' },
      })
      created.push({ email: emp.email, role: emp.role })
    }

    // Données exemple
    const employe = await prisma.employe.findUnique({ where: { email: 'test.employe@entreprise.com' } })
    const dirigeant = await prisma.employe.findUnique({ where: { email: 'test.dirigeant@entreprise.com' } })
    const secretaire = await prisma.employe.findUnique({ where: { email: 'test.secretaire@entreprise.com' } })

    if (employe) {
      const today = new Date()
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        if (date.getDay() === 0 || date.getDay() === 6) continue

        const id = `pt-${employe.id}-${date.toISOString().split('T')[0]}`

        await prisma.pointage.upsert({
          where: { id },
          update: {},
          create: { id, entrepriseId: entreprise.id, employeId: employe.id, date, heureArrivee: '09:00', heureDepart: '18:00', pauseDuree: 60, statut: 'PRESENT', heuresTravaillees: 8, heuresSupp: 0, valide: true },
        })

        const planId = `pl-${employe.id}-${date.toISOString().split('T')[0]}`
        await prisma.planning.upsert({
          where: { id: planId },
          update: {},
          create: { id: planId, entrepriseId: entreprise.id, employeId: employe.id, date, heureDebut: '09:00', heureFin: '18:00', pauseDuree: 60, statut: 'CONFIRME' },
        })
      }

      const prevMonth = new Date()
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      const periode = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

      await prisma.paie.upsert({
        where: { employeId_periode: { employeId: employe.id, periode } },
        update: {},
        create: {
          entrepriseId: entreprise.id, employeId: employe.id, periode,
          heuresTravaillees: 151.67, heuresSupp: 5, tauxHoraire: employe.tauxHoraire, tauxHeuresSupp: 1.25,
          salaireBrut: (151.67 * employe.tauxHoraire) + (5 * employe.tauxHoraire * 1.25),
          cotisationsSalariales: (151.67 * employe.tauxHoraire) * 0.22,
          cotisationsPatronales: (151.67 * employe.tauxHoraire) * 0.42,
          salaireNet: (151.67 * employe.tauxHoraire) * 0.78,
          notes: 'Fiche de paie de démonstration',
        },
      })
    }

    if (dirigeant) {
      await prisma.chatMessage.upsert({
        where: { id: 'msg-init-001' },
        update: {},
        create: { id: 'msg-init-001', entrepriseId: entreprise.id, auteurId: dirigeant.id, auteurNom: `${dirigeant.prenom} ${dirigeant.nom}`, auteurRole: 'DIRIGEANT', contenu: "Bienvenue sur PlanifyHub ! Consultez vos plannings, pointages et fiches de paie depuis ce dashboard.", type: 'ANNONCE', createdAt: new Date(Date.now() - 86400000 * 2) },
      })
    }

    if (secretaire) {
      await prisma.chatMessage.upsert({
        where: { id: 'msg-init-002' },
        update: {},
        create: { id: 'msg-init-002', entrepriseId: entreprise.id, auteurId: secretaire.id, auteurNom: `${secretaire.prenom} ${secretaire.nom}`, auteurRole: 'SECRETARIAT', contenu: "Rappel : les congés d'été doivent être posés avant le 30 avril. Merci de contacter le secrétariat.", type: 'TEXT', createdAt: new Date(Date.now() - 86400000) },
      })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Base de données initialisée avec succès !',
      comptes: created,
    })
  } catch (err: any) {
    console.error('Init error:', err)
    return NextResponse.json({ error: "Erreur d'initialisation", detail: err.message }, { status: 500 })
  }
}
