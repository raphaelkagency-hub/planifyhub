import { prisma } from '@/lib/prisma'

export async function generateNumeroDevis(entrepriseId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.devis.count({ where: { entrepriseId } })
  return `DEV-${year}-${String(count + 1).padStart(3, '0')}`
}

export async function generateNumeroFacture(entrepriseId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.facture.count({ where: { entrepriseId } })
  return `FAC-${year}-${String(count + 1).padStart(3, '0')}`
}

export function calculateLigne(quantite: number, prixUnitaire: number): number {
  return Math.round(quantite * prixUnitaire * 100) / 100
}

export function calculateTotals(lignes: { montantHT: number }[], tauxTVA: number) {
  const montantHT = Math.round(lignes.reduce((sum, l) => sum + l.montantHT, 0) * 100) / 100
  const montantTVA = Math.round(montantHT * (tauxTVA / 100) * 100) / 100
  const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100
  return { montantHT, montantTVA, montantTTC }
}
