'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, User, Music, Headphones } from 'lucide-react'
import { getDummyAccount, DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'
import { getDummyFollows } from '@/lib/dummy-follows'

export default function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<any[]>([])

  // If this is a dummy account, show dummy following list
  const dummyAccount = getDummyAccount(username)

  useEffect(() => {
    async function loadFollowing() {
      // ── Dummy profile ──────────────────────────────────────────────────
      if (dummyAccount) {
        // Show a random subset of other dummy accounts as "who they follow"
        const others = DUMMY_ACCOUNTS.filter(a => a.username !== username).slice(0, 8)
        setFollowing(others.map(a => ({
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

      const realFollowing: any[] = []

      if (userData) {
        const { data } = await supabase
          .from('follows')
          .select('following:users!following_id(*)')
          .eq('follower_id', userData.id)
          .order('created_at', { ascending: false })

        if (data) {
          realFollowing.push(...data.map((f: any) => ({
            id: f.following.id,
            username: f.following.username,
            full_name: f.following.full_name,
            role: f.following.role,
            avatar_url: f.following.avatar_url,
            isDummy: false,
          })))
        }
      }

      // Check if this is the currently logged-in user — if so, include dummy follows
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: selfData } = await supabase
          .from('users').select('id').eq('username', username).single()
        if (selfData?.id === authUser.id) {
          const dummyFollowedUsernames = getDummyFollows(authUser.id)
          const dummyFollows = DUMMY_ACCOUNTS.filter(a =>
            dummyFollowedUsernames.includes(a.username)
          ).map(a => ({
            id: a.id,
            username: a.username,
            full_name: a.full_name,
            role: a.role,
            avatar_color: a.avatar_color,
            initials: a.initials,
            isDummy: true,
          }))
          realFollowing.push(...dummyFollows)
        }
      }

      setFollowing(realFollowing)
      setLoading(false)
    }

    loadFollowing()
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
        <h1 className="text-2xl font-bold">@{username} is Following</h1>
      </div>

      <div className="space-y-3">
        {following.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Not following anyone yet.</p>
        ) : (
          following.map(user => (
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
