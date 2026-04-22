'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SignUp() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'artist' | 'listener'>('listener')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            username: formData.username,
            full_name: formData.fullName,
            role,
          })

        if (profileError) throw profileError

        // If artist, create artist profile
        if (role === 'artist') {
          const { error: artistError } = await supabase
            .from('artist_profiles')
            .insert({
              id: authData.user.id,
            })

          if (artistError) throw artistError
        }

        // Redirect to profile completion or dashboard
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">SoundScape</h1>
          <p className="text-muted-foreground">Join the music community</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setRole('listener')}
            className={`p-4 rounded-lg border-2 transition-all ${
              role === 'listener'
                ? 'border-accent bg-accent/10'
                : 'border-border bg-card hover:border-accent/50'
            }`}
          >
            <div className="text-sm font-semibold text-foreground">Listener</div>
            <div className="text-xs text-muted-foreground">Discover music</div>
          </button>
          <button
            onClick={() => setRole('artist')}
            className={`p-4 rounded-lg border-2 transition-all ${
              role === 'artist'
                ? 'border-accent bg-accent/10'
                : 'border-border bg-card hover:border-accent/50'
            }`}
          >
            <div className="text-sm font-semibold text-foreground">Artist</div>
            <div className="text-xs text-muted-foreground">Share your music</div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Your name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <Input
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
