export type AbonnementType = string

export interface FeatureSet {
  planningSimple: boolean
  pointageSimple: boolean
  fichesPaieBase: boolean
  notesFacultatives: boolean
  messagerie: boolean
  exportLimite: boolean
  exportComplet: boolean
  chatLectureSeule: boolean
  dashboardDirigeant: boolean
  gestionCongesAbsences: boolean
  notifications: boolean
  creationComptesSecretariat: boolean
  personnalisationHoraires: boolean
  rapportsRHFinanciers: boolean
  siteVitrine: boolean
  supportPrioritaire: boolean
  optimisationPlanning: boolean
  dashboardPerformance: boolean
  emailIntegration: boolean
}

// Toutes les fonctionnalités activées — plan unique
const TOUT_INCLUS: FeatureSet = {
  planningSimple: true,
  pointageSimple: true,
  fichesPaieBase: true,
  notesFacultatives: true,
  messagerie: true,
  exportLimite: true,
  exportComplet: true,
  chatLectureSeule: true,
  dashboardDirigeant: true,
  gestionCongesAbsences: true,
  notifications: true,
  creationComptesSecretariat: true,
  personnalisationHoraires: true,
  rapportsRHFinanciers: true,
  siteVitrine: false,
  supportPrioritaire: true,
  optimisationPlanning: true,
  dashboardPerformance: true,
  emailIntegration: true,
}

// Quel que soit le nom en base (PRO, BASIQUE, STANDARD, PREMIUM), tout est inclus
export const FEATURES: Record<string, FeatureSet> = {
  PRO: TOUT_INCLUS,
  BASIQUE: TOUT_INCLUS,
  STANDARD: TOUT_INCLUS,
  PREMIUM: TOUT_INCLUS,
}

export function getFeatures(abonnement: string): FeatureSet {
  return TOUT_INCLUS
}

export function hasFeature(abonnement: string, feature: keyof FeatureSet): boolean {
  return TOUT_INCLUS[feature] ?? true
}

export const PLAN = {
  id: 'PRO',
  name: 'Tout inclus',
  price: 200,
  description: 'Toutes les fonctionnalités pour gérer votre entreprise',
  stripePriceId: process.env.STRIPE_PRICE_PRO,
  features: [
    'Planning & gestion des horaires',
    'Pointage des présences',
    'Fiches de paie automatiques',
    'Notes facultatives sur fiches',
    'Gestion congés & absences',
    'Chat interne (lecture seule employés)',
    'Export Excel & Google Sheets illimité',
    'Dashboard dirigeant complet',
    'Rapports RH & financiers avancés',
    'Notifications en temps réel',
    'Création de comptes par secrétariat',
    'Personnalisation des horaires & pauses',
    'Dashboard performance par employé',
    'Intégration email complète',
    'Support prioritaire',
  ],
}

// Gardé pour compatibilité avec l'ancien code
export const PLANS = [PLAN]
