'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, User, Music, Headphones } from 'lucide-react'
import { getDummyAccount, DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'

export default function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [loading, setLoading] = useState(true)
  const [followers, setFollowers] = useState<any[]>([])

  const dummyAccount = getDummyAccount(username)

  useEffect(() => {
    async function loadFollowers() {
      // ── Dummy profile ──────────────────────────────────────────────────
      if (dummyAccount) {
        // Show a random set of dummy accounts as "followers"
        const base = DUMMY_ACCOUNTS.filter(a => a.username !== username)
        // Use followersCount to decide how many to show (cap at available dummies)
        const count = Math.min(dummyAccount.followersCount > 100 ? 10 : 5, base.length)
        setFollowers(base.slice(0, count).map(a => ({
          id: a.id,
          username: a.username,
          full_name: a.full_name,
          role: a.role,
          avatar_color: a.avatar_color,
          initials: a.initials,
          isDummy: true,
        })))
        setLoading(false)
        return
      }

      // ── Real user ──────────────────────────────────────────────────────
      const supabase = createClient()
      const { data: userData } = await supabase
        .from('users').select('id').eq('username', username).single()

      if (!userData) { setLoading(false); return }

      const { data } = await supabase
        .from('follows')
        .select('follower:users!follower_id(*)')
        .eq('following_id', userData.id)
        .order('created_at', { ascending: false })

      if (data) {
        setFollowers(data.map((f: any) => ({
          id: f.follower.id,
          username: f.follower.username,
          full_name: f.follower.full_name,
          role: f.follower.role,
          avatar_url: f.follower.avatar_url,
          isDummy: false,
        })))
      }
      setLoading(false)
    }

    loadFollowers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/profile/${username}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">@{username}'s Followers</h1>
      </div>

      <div className="space-y-3">
        {followers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No followers yet.</p>
        ) : (
          followers.map(user => (
            <Link key={user.id} href={`/dashboard/profile/${user.username}`}>
              <Card className="p-4 flex items-center gap-4 border-border hover:border-primary/50 transition group">
                {user.isDummy ? (
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${user.avatar_color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {user.initials}
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      : <User className="h-6 w-6 text-primary" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition">{user.full_name}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                {user.role === 'artist' ? (
                  <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    <Music className="h-3 w-3" /> Artist
                  </span>
                ) : user.role === 'listener' ? (
                  <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                    <Headphones className="h-3 w-3" /> Listener
                  </span>
                ) : null}
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
