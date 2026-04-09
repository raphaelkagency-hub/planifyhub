import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Vérifications de rôle pour les routes sensibles
    if (path.startsWith('/settings') && token?.role !== 'DIRIGEANT') {
      if (path === '/settings/entreprise' || path === '/settings/abonnement') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Accès admin uniquement pour la gestion des employés
    if (path.startsWith('/employes/create')) {
      if (token?.role === 'EMPLOYE') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Pages publiques
        if (
          path === '/' ||
          path === '/login' ||
          path === '/register' ||
          path === '/paiement' ||
          path.startsWith('/setup') ||
          path.startsWith('/api/setup') ||
          path.startsWith('/api/register') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/_next') ||
          path.startsWith('/favicon')
        ) {
          return true
        }

        // Toutes les autres pages nécessitent une authentification
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}
