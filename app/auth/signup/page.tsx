'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Music, Radio } from 'lucide-react'
import { ResonanceLogo } from '@/components/resonance-logo'
import { createClient } from '@/lib/supabase/client'

type UserType = 'artist' | 'listener'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userType, setUserType] = useState<UserType>('listener')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'artist' || type === 'listener') {
      setUserType(type as UserType)
    }
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      const supabase = createClient()

      // Enforce unique username check
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()
      
      if (existingUser) {
        throw new Error('User with this username already exists')
      }

      // Proceed with Supabase Auth Email tracking
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('User with this email exists')
        }
        throw new Error(authError.message)
      }

      // Push custom traits to users public table
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: username,
            full_name: fullName,
            role: userType,
            email: email
          })

        if (profileError) throw new Error('Could not create public profile. Please contact support.')
      }

      // Redirect to dashboard
      router.push('/dashboard/feed')
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
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
          <h1 className="text-3xl font-bold mb-2">
            Create {userType === 'artist' ? 'Artist' : 'Listener'} Account
          </h1>
          <p className="text-muted-foreground">Join our music community today</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setUserType('listener')}
            className={`p-4 rounded-lg border-2 transition-all glass ${
               userType === 'listener'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Radio className="h-6 w-6 mx-auto mb-2 text-foreground" />
            <p className="font-semibold">Listener</p>
            <p className="text-xs text-muted-foreground">Discover & enjoy</p>
          </button>

          <button
            type="button"
            onClick={() => setUserType('artist')}
            className={`p-4 rounded-lg border-2 transition-all glass ${
               userType === 'artist'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Music className="h-6 w-6 mx-auto mb-2 text-foreground" />
            <p className="font-semibold">Artist</p>
            <p className="text-xs text-muted-foreground">Create & share</p>
          </button>
        </div>

        {/* Signup Form */}
        <Card className="p-6 border-white/10 glass bg-transparent">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
              <p className="text-xs text-muted-foreground mt-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
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
              {loading ? 'Creating Account...' : `Create ${userType === 'artist' ? 'Artist' : 'Listener'} Account`}
            </Button>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        </Card>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
