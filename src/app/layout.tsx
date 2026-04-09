import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanifyHub - Gestion RH d\'entreprise',
  description: 'Plateforme RH complète pour entreprises : planning, pointage, paie, gestion des employés et plus encore.',
  keywords: 'gestion entreprise, planning, pointage, paie, RH, SaaS, PlanifyHub',
  openGraph: {
    title: 'PlanifyHub - Gestion RH d\'entreprise',
    description: 'La solution RH complète pour gérer votre entreprise',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
