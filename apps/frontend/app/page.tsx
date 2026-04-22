'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-border">
        <h1 className="text-3xl font-bold text-accent">SoundScape</h1>
        <div className="flex gap-4">
          <Link href="/signin">
            <Button variant="ghost" className="text-foreground hover:text-accent">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-3xl text-center space-y-6">
          <h2 className="text-6xl font-bold text-foreground leading-tight">
            Connect, Share & Discover Music
          </h2>
          <p className="text-xl text-muted-foreground">
            A futuristic social platform for musicians and music lovers. Upload your tracks,
            collaborate with artists, sell merchandise, and build your fanbase.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
            <div className="p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Share Music</h3>
              <p className="text-sm text-muted-foreground">Upload and share your tracks with the world</p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Collaborate</h3>
              <p className="text-sm text-muted-foreground">Work with other artists and create together</p>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors">
              <div className="text-4xl mb-4">🎟️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Host Events</h3>
              <p className="text-sm text-muted-foreground">Organize shows and sell tickets directly</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg">
                Join as Artist
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10 px-8 py-6 text-lg"
              >
                Join as Listener
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-muted-foreground text-sm">
        <p>&copy; 2024 SoundScape. All rights reserved.</p>
      </footer>
    </div>
  )
}
