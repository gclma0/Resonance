import Stripe from 'stripe'

export type Currency = 'USD' | 'BDT'
export type PaymentMethod = 'stripe' | 'bkash'

export interface PaymentIntent {
  id: string
  amount: number
  currency: Currency
  status: 'pending' | 'completed' | 'failed'
  method: PaymentMethod
}

// Initialize Stripe with BDT support
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia',
})

export const paymentUtils = {
  // Convert USD to BDT (approximate rate - should be dynamic in production)
  convertUSDToBDT: (usdAmount: number): number => {
    const EXCHANGE_RATE = 108 // 1 USD ≈ 108 BDT
    return Math.round(usdAmount * EXCHANGE_RATE * 100) / 100
  },

  // Create Stripe payment intent for both USD and BDT
  createStripePaymentIntent: async (
    amount: number,
    currency: Currency,
    metadata?: Record<string, string>
  ): Promise<string> => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency === 'BDT' ? 'bdt' : 'usd',
      metadata: metadata || {},
    })
    return paymentIntent.client_secret || ''
  },

  // Validate payment intent
  confirmPaymentIntent: async (paymentIntentId: string): Promise<boolean> => {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.status === 'succeeded'
  },
}

// bKash payment utilities
export const bkashUtils = {
  // Create bKash payment token
  createPaymentToken: async (
    amount: number,
    referenceID: string
  ): Promise<string> => {
    // This would integrate with actual bKash API
    // For now, returning mock token
    console.log(`Creating bKash payment for ${amount} BDT with reference ${referenceID}`)
    return `bkash_token_${Date.now()}`
  },

  // Execute bKash payment
  executePayment: async (
    paymentID: string,
    amount: number
  ): Promise<boolean> => {
    console.log(`Executing bKash payment ${paymentID} for ${amount} BDT`)
    return true
  },
}
