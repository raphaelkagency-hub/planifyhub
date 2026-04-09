import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_PRO
    const appUrl = process.env.NEXTAUTH_URL ?? 'https://planifyhub.vercel.app'

    if (!stripeKey || !stripeKey.startsWith('sk_') || !priceId) {
      return NextResponse.json({ demo: true, url: null })
    }

    const stripe = require('stripe')(stripeKey)

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?paiement=success`,
      cancel_url: `${appUrl}/paiement?canceled=true`,
      customer_email: session!.user.email,
      metadata: {
        entrepriseId: session!.user.entrepriseId,
      },
    })

    // Marquer en attente de paiement
    await prisma.entreprise.update({
      where: { id: session!.user.entrepriseId },
      data: { stripeStatus: 'pending' },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[CHECKOUT ERROR]', err)
    return NextResponse.json({ error: 'Erreur paiement' }, { status: 500 })
  }
}
