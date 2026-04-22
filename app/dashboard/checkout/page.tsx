'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Lock, CreditCard } from 'lucide-react'

interface CheckoutItem {
  id: string
  type: 'show' | 'merchandise'
  title: string
  quantity: number
  priceUSD: number
  priceBDT: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bkash'>('stripe')
  const [currency, setCurrency] = useState<'usd' | 'bdt'>('usd')
  const [loading, setLoading] = useState(false)
  const [cartItems, setCartItems] = useState<CheckoutItem[]>([])
  const [cartReady, setCartReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('checkout_cart')
      if (raw) setCartItems(JSON.parse(raw))
    } catch {}
    setCartReady(true)
  }, [])

  const subtotal = cartItems.reduce((sum, item) => {
    return (
      sum +
      item.quantity * (currency === 'usd' ? item.priceUSD : item.priceBDT)
    )
  }, 0)

  const tax = subtotal * 0.05
  const total = subtotal + tax

  const handlePayment = async () => {
    setLoading(true)

    try {
      if (paymentMethod === 'stripe') {
        // Create Stripe payment intent
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: currency,
            description: cartItems
              .map((item) => `${item.title} (x${item.quantity})`)
              .join(', '),
            metadata: {
              items: JSON.stringify(cartItems),
            },
          }),
        })

        const data = await response.json()
        console.log('[v0] Stripe payment intent created:', data)

        // In a real app, redirect to Stripe checkout
        // For now, show success message
        alert('Payment processing... In a real app, this would redirect to Stripe.')
      } else if (paymentMethod === 'bkash') {
        // Create bKash payment
        const response = await fetch('/api/payments/bkash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            referenceId: `order_${Date.now()}`,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment-callback`,
            description: cartItems
              .map((item) => item.title)
              .join(', '),
          }),
        })

        const data = await response.json()
        console.log('[v0] bKash payment initiated:', data)

        // In a real app, redirect to bKash checkout
        // For now, show success message
        alert('bKash payment initiated... In a real app, this would redirect to bKash.')
      }

      // Simulate successful payment
      setTimeout(() => {
        router.push('/payment-success')
      }, 2000)
    } catch (error: any) {
      console.error('[v0] Payment error:', error)
      alert('Payment failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/marketplace">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {/* Loading */}
      {!cartReady && (
        <div className="flex items-center justify-center py-24">
          <Lock className="h-6 w-6 animate-pulse text-primary mr-2" />
          <span className="text-muted-foreground">Loading your cart…</span>
        </div>
      )}

      {/* Empty cart */}
      {cartReady && cartItems.length === 0 && (
        <div className="text-center py-20">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-6">Add something from the marketplace or buy show tickets first.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/marketplace"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Browse Marketplace</Button></Link>
            <Link href="/dashboard/shows"><Button variant="outline">View Shows</Button></Link>
          </div>
        </div>
      )}

      {cartReady && cartItems.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Currency Selection */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-bold mb-4">Select Currency</h2>
              <div className="flex items-center gap-6">
                {(['usd', 'bdt'] as const).map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="currency" value={c} checked={currency === c}
                      onChange={() => setCurrency(c)}
                      className="accent-primary w-4 h-4" />
                    <span>{c === 'usd' ? 'USD (US Dollar)' : 'BDT (Bangladeshi Taka)'}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Payment Method Selection */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>

              <div className="space-y-3">
                {/* Stripe */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary/50 transition"
                  style={{ borderColor: paymentMethod === 'stripe' ? 'var(--primary)' : undefined }}>
                  <input type="radio" name="payMethod" value="stripe" checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')} className="accent-primary w-4 h-4" />
                  <div className="ml-4">
                    <p className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Stripe (Credit Card)
                    </p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                </label>

                {currency === 'bdt' && (
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary/50 transition"
                    style={{ borderColor: paymentMethod === 'bkash' ? 'var(--primary)' : undefined }}>
                    <input type="radio" name="payMethod" value="bkash" checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')} className="accent-primary w-4 h-4" />
                    <div className="ml-4">
                      <p className="font-semibold">bKash (Mobile Banking)</p>
                      <p className="text-sm text-muted-foreground">Bangladesh mobile banking service</p>
                    </div>
                  </label>
                )}
              </div>
            </Card>

            {/* Billing Information */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-bold mb-4">Billing Information</h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <Input placeholder="123 Main St" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City
                    </label>
                    <Input placeholder="Dhaka" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country
                    </label>
                    <Input placeholder="Bangladesh" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="p-6 border-border sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                {cartItems.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm">{item.title}</p>
                      <p className="text-sm font-medium">
                        {currency === 'usd'
                          ? `$${(item.priceUSD * item.quantity).toFixed(2)}`
                          : `৳${(item.priceBDT * item.quantity).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {currency === 'usd'
                      ? `$${subtotal.toFixed(2)}`
                      : `৳${subtotal.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (5%)</span>
                  <span>
                    {currency === 'usd'
                      ? `$${tax.toFixed(2)}`
                      : `৳${tax.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="pb-6 mb-6 border-t border-b border-border pt-6">
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {currency === 'usd'
                      ? `$${total.toFixed(2)}`
                      : `৳${total.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </Button>

              <Link href="/dashboard/marketplace">
                <Button variant="ghost" className="w-full mt-2">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}
