'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trophy, TrendingUp, Users, Heart, Star, UserPlus, Check } from 'lucide-react'
import { getDummyAccount } from '@/lib/dummy-accounts'
import { isDummyFollowing, toggleDummyFollow } from '@/lib/dummy-follows'

interface ArtistEntry {
  id: string
  username: string
  name: string
  bio: string
  baseFollowers: number
  totalLikes: number
  rating: number
  reviews: number
  trend: 'up' | 'down' | 'stable'
}

const ARTIST_LIST: ArtistEntry[] = [
  { id: '1', username: 'alexjohns',  name: 'Alex Johnson', bio: 'Electronic & Synth-pop producer', baseFollowers: 12543, totalLikes: 45678, rating: 4.9, reviews: 1234, trend: 'up' },
  { id: '2', username: 'lunawaves',  name: 'Luna Waves',   bio: 'Singer-songwriter & producer',    baseFollowers: 10234, totalLikes: 38901, rating: 4.8, reviews: 987,  trend: 'stable' },
  { id: '3', username: 'jazzvibes',  name: 'Jazz Vibes',   bio: 'Jazz & fusion specialist',         baseFollowers: 8756,  totalLikes: 32145, rating: 4.7, reviews: 765,  trend: 'up' },
  { id: '4', username: 'djstudio',   name: 'DJ Studio',    bio: 'House & electronic DJ',            baseFollowers: 7890,  totalLikes: 28934, rating: 4.6, reviews: 654,  trend: 'down' },
  { id: '5', username: 'echosound',  name: 'Echo Sound',   bio: 'Ambient & experimental music',    baseFollowers: 6543,  totalLikes: 24567, rating: 4.5, reviews: 543,  trend: 'up' },
  { id: '6', username: 'synthwave',  name: 'Synth Wave',   bio: 'Retro synth & vaporwave',         baseFollowers: 5432,  totalLikes: 19876, rating: 4.4, reviews: 432,  trend: 'stable' },
]

import { createClient } from '@/lib/supabase/client'

export default function PopularArtistsPage() {
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'likes'>('rating')
  const [followed, setFollowed] = useState<Record<string, boolean>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 3

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const init: Record<string, boolean> = {}
        ARTIST_LIST.forEach(a => { init[a.id] = isDummyFollowing(a.username, user.id) })
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

  const sortedArtists = [...ARTIST_LIST].sort((a, b) => {
    const aFollowers = a.baseFollowers + (followed[a.id] ? 1 : 0)
    const bFollowers = b.baseFollowers + (followed[b.id] ? 1 : 0)
    switch (sortBy) {
      case 'followers': return bFollowers - aFollowers
      case 'likes':     return b.totalLikes - a.totalLikes
      default:          return b.rating - a.rating
    }
  })

  const totalPages = Math.ceil(sortedArtists.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedArtists = sortedArtists.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center gap-2 mb-8">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Popular Artists</h1>
      </div>

      {/* Sort Controls */}
      <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
        {(['rating', 'followers', 'likes'] as const).map(sort => (
          <Button key={sort} variant={sortBy === sort ? 'default' : 'outline'}
            onClick={() => { setSortBy(sort); setCurrentPage(1) }}
            className={sortBy === sort ? 'bg-primary' : ''}>
            {sort === 'rating' ? 'Top Rated' : sort === 'followers' ? 'Most Followed' : 'Most Liked'}
          </Button>
        ))}
      </div>

      {/* Artists List */}
      <div className="space-y-4">
        {paginatedArtists.map((artist, index) => {
          const globalIndex = startIndex + index + 1
          const dummy = getDummyAccount(artist.username)
          const liveFollowers = artist.baseFollowers + (followed[artist.id] ? 1 : 0)
          const avatarColor = dummy?.avatar_color ?? 'from-primary to-secondary'
          const initials = dummy?.initials ?? artist.name.charAt(0)

          return (
            <Card key={artist.id}
              className="p-6 border-border hover:border-primary/50 transition group">
              <div className="flex items-center gap-6">
                {/* Rank + Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <Link href={`/dashboard/profile/${artist.username}`}>
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg hover:opacity-80 transition`}>
                      {initials}
                    </div>
                  </Link>
                  <span className="text-xs font-bold text-muted-foreground">#{globalIndex}</span>
                </div>

                {/* Artist Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/dashboard/profile/${artist.username}`}
                      className="font-bold text-lg group-hover:text-primary transition">
                      {artist.name}
                    </Link>

                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      artist.trend === 'up'   ? 'bg-green-500/20 text-green-600' :
                      artist.trend === 'down' ? 'bg-destructive/20 text-destructive' :
                                                'bg-muted text-muted-foreground'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {artist.trend === 'up' ? 'Rising' : artist.trend === 'down' ? 'Falling' : 'Stable'}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">@{artist.username}</p>
                  <p className="text-sm text-foreground mb-3">{artist.bio}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{artist.rating}</span>
                        <span className="text-xs text-muted-foreground">({artist.reviews})</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Followers</p>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {liveFollowers >= 1000
                            ? `${(liveFollowers / 1000).toFixed(1)}K`
                            : liveFollowers.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Likes</p>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-destructive" />
                        <span className="font-semibold">{(artist.totalLikes / 1000).toFixed(1)}K</span>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => handleFollow(artist.id, artist.username)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          followed[artist.id]
                            ? 'bg-muted text-muted-foreground border border-border'
                            : 'bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm shadow-primary/25'
                        }`}
                      >
                        {followed[artist.id]
                          ? <><Check className="h-4 w-4" /> Following</>
                          : <><UserPlus className="h-4 w-4" /> Follow</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}>
            Previous
          </Button>
          
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button key={i} 
              variant={currentPage === i + 1 ? 'default' : 'outline'} 
              size="sm" 
              className={currentPage === i + 1 ? 'bg-primary' : ''}
              onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Button>
          ))}

          <Button variant="outline" size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      )}
    </main>
  )
}
