'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Music, Headphones, UserPlus, Check, ArrowLeft, Star, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SearchBar } from '@/components/search-bar'
import Link from 'next/link'
import { DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'
import { isDummyFollowing, toggleDummyFollow } from '@/lib/dummy-follows'

type FilterType = 'all' | 'artist' | 'listener'

import { createClient } from '@/lib/supabase/client'

export default function SuggestionsPage() {
  const [followed, setFollowed] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<FilterType>('all')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Initialise from localStorage on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const init: Record<string, boolean> = {}
        DUMMY_ACCOUNTS.forEach(a => { init[a.id] = isDummyFollowing(a.username, user.id) })
        setFollowed(init)
      }
    }
    loadUser()
  }, [])

  const handleFollow = (id: string, username: string) => {
    if (!currentUser) return
    toggleDummyFollow(username, currentUser.id)
    setFollowed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered = DUMMY_ACCOUNTS.filter(p =>
    filter === 'all' ? true : p.role === filter
  )

  const filterBtnClass = (f: FilterType) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
      filter === f
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/feed"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Feed
          </Link>
          <h1 className="text-3xl font-bold mb-1">People to Follow</h1>
          <p className="text-muted-foreground">
            Discover artists and listeners in the Resonance community.
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <button className={filterBtnClass('all')} onClick={() => setFilter('all')}>
              All
            </button>
            <button className={filterBtnClass('artist')} onClick={() => setFilter('artist')}>
              🎵 Artists
            </button>
            <button className={filterBtnClass('listener')} onClick={() => setFilter('listener')}>
              🎧 Listeners
            </button>
          </div>
          <div className="relative flex-1 w-full max-w-sm md:hidden">
            <SearchBar />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((person) => (
            <Card
              key={person.id}
              className="border-border hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden group"
            >
              {/* Card top gradient bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${person.avatar_color}`} />

              <div className="p-5">
                {/* Avatar + Name Row */}
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/dashboard/profile/${person.username}`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${person.avatar_color} flex items-center justify-center flex-shrink-0 shadow-md text-white font-bold text-lg hover:opacity-80 transition`}>
                      {person.initials}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/profile/${person.username}`} className="font-bold text-base leading-tight truncate hover:underline">
                        {person.full_name}
                      </Link>
                      {person.featured && (
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{person.username}</p>

                    {/* Role badge */}
                    <div className="mt-1">
                      {person.role === 'artist' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">
                          <Music className="h-2.5 w-2.5" /> Artist
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400">
                          <Headphones className="h-2.5 w-2.5" /> Listener
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {person.bio}
                </p>

                {/* Stats Row */}
                <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                  <span><span className="font-semibold text-foreground">{person.followers}</span> followers</span>
                  <span className="text-border">|</span>
                  <span className="truncate text-primary/80">{person.genre}</span>
                  {person.tracks !== null && (
                    <>
                      <span className="text-border">|</span>
                      <span><span className="font-semibold text-foreground">{person.tracks}</span> tracks</span>
                    </>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(person.id, person.username)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                    followed[person.id]
                      ? 'bg-muted text-muted-foreground border border-border'
                      : 'bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm shadow-primary/25'
                  }`}
                >
                  {followed[person.id] ? (
                    <><Check className="h-4 w-4" /> Following</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> Follow</>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Showing {filtered.length} suggestions · More will appear as the community grows
        </p>
      </div>
    </div>
  )
}
