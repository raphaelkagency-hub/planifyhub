export type PlanId = 'STARTER' | 'BUSINESS' | 'ENTERPRISE' | 'PRO'

export interface Plan {
  id: string
  name: string
  price: number
  maxEmployes: number | null
  features: string[]
  description: string
  popular?: boolean
  stripePriceId?: string
}

export const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 49,
    maxEmployes: 10,
    description: 'Parfait pour les petites équipes',
    features: [
      "Jusqu'à 10 employés",
      'Planning & pointage',
      'Fiches de paie',
      'Congés & absences',
      'Chat interne',
      'Export Excel',
      'Support email',
    ],
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 99,
    maxEmployes: 25,
    description: 'Pour les équipes en croissance',
    popular: true,
    features: [
      "Jusqu'à 25 employés",
      'Tout Starter inclus',
      'Facturation & devis',
      'Gestion de documents',
      'Rapports avancés',
      'Export PDF & comptable',
      'Support prioritaire',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 199,
    maxEmployes: null,
    description: 'Pour les grandes entreprises',
    features: [
      'Employés illimités',
      'Tout Business inclus',
      'Onboarding personnalisé',
      'SLA garanti 99.9%',
      'Support dédié',
      'Formation incluse',
    ],
  },
]

export function getPlan(planId: string): Plan {
  return PLANS.find(p => p.id === planId) ?? PLANS[0]
}

export function getMaxEmployes(planId: string): number | null {
  return getPlan(planId).maxEmployes
}

export function canAddEmploye(planId: string, currentCount: number): boolean {
  const max = getMaxEmployes(planId)
  if (max === null) return true
  return currentCount < max
}

// Compat: toutes les fonctionnalités sont incluses dans tous les plans
export function hasFeature(_abonnement: string, _feature: string): boolean {
  return true
}
