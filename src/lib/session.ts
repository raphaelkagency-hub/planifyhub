import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireRole(allowedRoles: string[]) {
  const { error, session } = await requireAuth()
  if (error || !session) return { error: error ?? NextResponse.json({ error: 'Non authentifié' }, { status: 401 }), session: null }

  if (!allowedRoles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 }), session: null }
  }

  return { error: null, session }
}
