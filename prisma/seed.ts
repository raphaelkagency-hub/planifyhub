import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initialisation de la base de données...')

  const entreprise = await prisma.entreprise.upsert({
    where: { id: 'entreprise-test-001' },
    update: {
      horairesDebutConfig: '08:00,08:30,09:00,09:30,10:00',
      heuresContractuelles: 35,
      heuresSupPayees: true,
      tauxHeuresSuppMultiplier: 1.25,
    },
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

  console.log('✅ Entreprise créée:', entreprise.nom)

  const hashDirigeant = await bcrypt.hash('Dirigeant123!', 12)
  const hashSecretaire = await bcrypt.hash('Secretaire123!', 12)
  const hashEmploye = await bcrypt.hash('Employe123!', 12)

  const dirigeant = await prisma.employe.upsert({
    where: { email: 'test.dirigeant@entreprise.com' },
    update: { password: hashDirigeant },
    create: {
      email: 'test.dirigeant@entreprise.com',
      password: hashDirigeant,
      nom: 'Martin',
      prenom: 'Jean',
      role: 'DIRIGEANT',
      poste: 'Directeur Général',
      tauxHoraire: 50.0,
      entrepriseId: entreprise.id,
      dateEmbauche: new Date('2020-01-01'),
      passwordDefinedBy: 'self',
    },
  })
  console.log('✅ Compte Dirigeant:', dirigeant.email)

  const secretaire = await prisma.employe.upsert({
    where: { email: 'test.secretaire@entreprise.com' },
    update: { password: hashSecretaire },
    create: {
      email: 'test.secretaire@entreprise.com',
      password: hashSecretaire,
      nom: 'Dupont',
      prenom: 'Marie',
      role: 'SECRETARIAT',
      poste: 'Assistante de Direction',
      tauxHoraire: 22.0,
      entrepriseId: entreprise.id,
      dateEmbauche: new Date('2021-03-15'),
      passwordDefinedBy: 'admin',
    },
  })
  console.log('✅ Compte Secrétariat:', secretaire.email)

  const employe = await prisma.employe.upsert({
    where: { email: 'test.employe@entreprise.com' },
    update: { password: hashEmploye },
    create: {
      email: 'test.employe@entreprise.com',
      password: hashEmploye,
      nom: 'Bernard',
      prenom: 'Pierre',
      role: 'EMPLOYE',
      poste: 'Technicien',
      tauxHoraire: 17.5,
      entrepriseId: entreprise.id,
      dateEmbauche: new Date('2022-06-01'),
      passwordDefinedBy: 'admin',
    },
  })
  console.log('✅ Compte Employé:', employe.email)

  // Pointages des 5 derniers jours ouvrés (heures en string HH:mm)
  const today = new Date()
  let created = 0
  for (let i = 1; i <= 10 && created < 5; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue
    created++

    const dateStr = date.toISOString().split('T')[0]

    await prisma.pointage.upsert({
      where: { id: `pt-${employe.id}-${dateStr}` },
      update: {},
      create: {
        id: `pt-${employe.id}-${dateStr}`,
        entrepriseId: entreprise.id,
        employeId: employe.id,
        date,
        heureArrivee: '09:00',
        heureDepart: '18:00',
        pauseDuree: 60,
        statut: 'PRESENT',
        heuresTravaillees: 8,
        heuresSupp: 0,
        valide: true,
      },
    })

    await prisma.planning.upsert({
      where: { id: `pl-${employe.id}-${dateStr}` },
      update: {},
      create: {
        id: `pl-${employe.id}-${dateStr}`,
        entrepriseId: entreprise.id,
        employeId: employe.id,
        date,
        heureDebut: '09:00',
        heureFin: '18:00',
        pauseDuree: 60,
        statut: 'CONFIRME',
      },
    })
  }
  console.log('✅ Pointages et plannings créés')

  // Fiche de paie du mois précédent
  const prevMonth = new Date(today)
  prevMonth.setMonth(today.getMonth() - 1)
  const periode = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

  await prisma.paie.upsert({
    where: { employeId_periode: { employeId: employe.id, periode } },
    update: {},
    create: {
      entrepriseId: entreprise.id,
      employeId: employe.id,
      periode,
      heuresTravaillees: 151.67,
      heuresSupp: 5,
      tauxHoraire: employe.tauxHoraire,
      tauxHeuresSupp: 1.25,
      salaireBrut: (151.67 * employe.tauxHoraire) + (5 * employe.tauxHoraire * 1.25),
      cotisationsSalariales: (151.67 * employe.tauxHoraire) * 0.22,
      cotisationsPatronales: (151.67 * employe.tauxHoraire) * 0.42,
      salaireNet: (151.67 * employe.tauxHoraire) * 0.78,
      notes: 'Fiche de paie de démonstration',
    },
  })
  console.log('✅ Fiche de paie créée')

  // Messages chat
  await prisma.chatMessage.upsert({
    where: { id: 'msg-001' },
    update: {},
    create: {
      id: 'msg-001',
      entrepriseId: entreprise.id,
      auteurId: dirigeant.id,
      auteurNom: `${dirigeant.prenom} ${dirigeant.nom}`,
      auteurRole: 'DIRIGEANT',
      contenu: "Bienvenue sur PlanifyHub ! Consultez vos plannings, pointages et fiches de paie depuis ce dashboard.",
      type: 'ANNONCE',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  })

  await prisma.chatMessage.upsert({
    where: { id: 'msg-002' },
    update: {},
    create: {
      id: 'msg-002',
      entrepriseId: entreprise.id,
      auteurId: secretaire.id,
      auteurNom: `${secretaire.prenom} ${secretaire.nom}`,
      auteurRole: 'SECRETARIAT',
      contenu: "Rappel : les congés d'été doivent être posés avant le 30 avril.",
      type: 'TEXT',
      createdAt: new Date(Date.now() - 86400000),
    },
  })
  console.log('✅ Messages chat créés')

  console.log('\n🎉 Initialisation terminée !')
  console.log('📋 Comptes de test :')
  console.log('   Dirigeant   → test.dirigeant@entreprise.com / Dirigeant123!')
  console.log('   Secrétariat → test.secretaire@entreprise.com / Secretaire123!')
  console.log('   Employé     → test.employe@entreprise.com / Employe123!')
}

main()
  .catch((e) => { console.error('❌ Erreur:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
