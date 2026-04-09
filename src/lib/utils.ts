import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m > 0 ? m.toString().padStart(2, '0') : '00'}`
}

export function getPeriodeLabel(periode: string): string {
  const [year, month] = periode.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function getCurrentPeriode(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function calculateHeuresTravaillees(
  heureArrivee: Date,
  heureDepart: Date,
  pauseDuree: number
): number {
  const totalMinutes = (heureDepart.getTime() - heureArrivee.getTime()) / 60000
  const netMinutes = totalMinutes - pauseDuree
  return Math.max(0, netMinutes / 60)
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    DIRIGEANT: 'Dirigeant',
    SECRETARIAT: 'Secrétariat',
    EMPLOYE: 'Employé',
  }
  return labels[role] ?? role
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    DIRIGEANT: 'bg-purple-100 text-purple-800',
    SECRETARIAT: 'bg-blue-100 text-blue-800',
    EMPLOYE: 'bg-green-100 text-green-800',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-800'
}

export function getStatutBadgeColor(statut: string): string {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    CONGE: 'bg-blue-100 text-blue-800',
    MALADIE: 'bg-yellow-100 text-yellow-800',
    FERIE: 'bg-gray-100 text-gray-800',
    PLANIFIE: 'bg-blue-100 text-blue-800',
    CONFIRME: 'bg-green-100 text-green-800',
    ANNULE: 'bg-red-100 text-red-800',
  }
  return colors[statut] ?? 'bg-gray-100 text-gray-800'
}
