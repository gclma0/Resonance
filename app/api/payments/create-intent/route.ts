import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, metadata } = body

    // Validate currency (BDT or USD)
    if (!['bdt', 'usd'].includes(currency.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents/lowest denomination
      currency: currency.toLowerCase(),
      description,
      metadata: metadata || {},
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('[v0] Payment intent error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
