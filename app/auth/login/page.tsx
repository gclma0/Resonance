'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ResonanceLogo } from '@/components/resonance-logo'
import { Music } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      // Redirect to dashboard on success
      router.push('/dashboard/feed')
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex items-center justify-center px-4 overflow-hidden relative">
      {/* Mesh Gradients from Design */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] mesh-gradient-bottom blur-[40px] rounded-full" />
        <div className="absolute -bottom-[150px] -left-[150px] w-[500px] h-[500px] mesh-gradient-bottom blur-[40px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <ResonanceLogo size={36} />
            <span className="font-display font-black text-2xl tracking-[0.2em] uppercase text-foreground">Resonance</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Resonance node</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 border-white/10 glass bg-transparent">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="#"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold transition-all hover:bg-primary/90"
              style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.1)' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
