import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      entrepriseId: string
      entrepriseNom: string
      abonnement: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    entrepriseId: string
    entrepriseNom: string
    abonnement: string
  }
}
