'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResonanceLogo } from '@/components/resonance-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell, MessageSquare, LogOut, User, Home, Rss, Users, Ticket, ShoppingBag } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from '@/components/search-bar'

function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setCurrentUser(data)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold hover:bg-accent hover:text-accent-foreground transition overflow-hidden text-secondary-foreground"
      >
        {currentUser?.avatar_url ? (
          <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-border py-1 z-50 overflow-hidden">
          <Link href={currentUser ? `/dashboard/profile/${currentUser.username}` : '#'} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition" onClick={() => setIsOpen(false)}>
            My Profile
          </Link>
          {currentUser?.role === 'artist' && (
            <>
              <Link href="/dashboard/artist/music" className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition" onClick={() => setIsOpen(false)}>
                Upload Music
              </Link>
              <Link href="/dashboard/artist/shows" className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition" onClick={() => setIsOpen(false)}>
                Manage Shows
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background/90 border-b border-border/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ResonanceLogo size={34} />
            </Link>
            
            <div className="hidden md:block w-full max-w-md ml-4">
              <SearchBar />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
              <Bell className="h-5 w-5" />
            </Button>
            <Link href="/dashboard/messages">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <UserProfileDropdown />
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Fixed sidebar — always visible below the navbar */}
        <aside className="hidden md:flex w-20 flex-shrink-0">
          {/* invisible spacer so flex layout reserves the width */}
        </aside>
        <div className="hidden md:flex fixed top-[65px] left-0 w-20 h-[calc(100vh-65px)] flex-col items-center pt-6 space-y-2 z-40 bg-background/95 border-r border-border/50">
          {[
            { href: '/dashboard',             icon: Home,        label: 'Home' },
            { href: '/dashboard/feed',         icon: Rss,         label: 'Feed' },
            { href: '/dashboard/artists',      icon: Users,       label: 'Artists' },
            { href: '/dashboard/shows',        icon: Ticket,      label: 'Shows' },
            { href: '/dashboard/marketplace',  icon: ShoppingBag, label: 'Marketplace' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} title={label}>
              <div className="p-3 rounded-xl transition-all group hover:bg-accent">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
