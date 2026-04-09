import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const employe = await prisma.employe.findUnique({
          where: { email: credentials.email },
          include: { entreprise: true },
        })

        if (!employe) {
          throw new Error('Identifiants invalides')
        }

        if (!employe.actif) {
          throw new Error('Compte désactivé')
        }

        const passwordMatch = await bcrypt.compare(credentials.password, employe.password)

        if (!passwordMatch) {
          throw new Error('Identifiants invalides')
        }

        return {
          id: employe.id,
          email: employe.email,
          name: `${employe.prenom} ${employe.nom}`,
          role: employe.role,
          entrepriseId: employe.entrepriseId,
          entrepriseNom: employe.entreprise.nom,
          abonnement: employe.entreprise.abonnement,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.entrepriseId = (user as any).entrepriseId
        token.entrepriseNom = (user as any).entrepriseNom
        token.abonnement = (user as any).abonnement
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.entrepriseId = token.entrepriseId as string
        session.user.entrepriseNom = token.entrepriseNom as string
        session.user.abonnement = token.abonnement as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
  secret: process.env.NEXTAUTH_SECRET,
}
