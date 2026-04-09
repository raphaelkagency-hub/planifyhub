import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import { PLANS } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(['DIRIGEANT'])
  if (error) return error

  try {
    const body = await req.json()
    const { planId } = body

    const plan = PLANS.find(p => p.id === planId)
    if (!plan) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

    // If Stripe is configured, create a checkout session
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: plan.stripePriceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?canceled=true`,
        metadata: {
          entrepriseId: session!.user.entrepriseId,
          planId,
        },
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // Demo mode: just return null url, let client handle it directly
    return NextResponse.json({ url: null, demo: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
