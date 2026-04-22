'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserProfileCard } from '@/components/user-profile-card'
import { Music, MessageSquare, Heart, Share2, Loader2, Play, Pause, MapPin, Globe, Calendar, Headphones, UserPlus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDummyAccount, type DummyAccount } from '@/lib/dummy-accounts'
import { isDummyFollowing, toggleDummyFollow, getDummyFollows } from '@/lib/dummy-follows'

// ── Dummy profile view ──────────────────────────────────────────────────────
function DummyProfilePage({ account }: { account: DummyAccount }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'posts'>('all')

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        setIsFollowing(isDummyFollowing(account.username, user.id))
      }
    }
    loadUser()
  }, [account.username])

  const handleFollow = () => {
    if (!currentUser) return
    const nowFollowing = toggleDummyFollow(account.username, currentUser.id)
    setIsFollowing(nowFollowing)
  }

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`pb-4 transition font-medium ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
    </button>
  )

  const showTracks = activeTab === 'all' || activeTab === 'music'
  const showPosts  = activeTab === 'all' || activeTab === 'posts'

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Cover banner */}
      <div className={`w-full h-40 rounded-2xl bg-gradient-to-r ${account.avatar_color} mb-0 opacity-60`} />

      {/* Profile header card */}
      <Card className="border-border -mt-10 mx-2 p-6 relative">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${account.avatar_color} flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0 -mt-12 border-4 border-background`}>
            {account.initials}
          </div>

          <div className="flex-1 min-w-0 mt-0 sm:-mt-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{account.full_name}</h1>
                  {account.role === 'artist' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                      <Music className="h-3 w-3" /> Artist
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400">
                      <Headphones className="h-3 w-3" /> Listener
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">@{account.username}</p>
              </div>

              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                  isFollowing
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm shadow-primary/25'
                }`}
              >
                {isFollowing ? <><Check className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{account.bio}</p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {account.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{account.location}</span>
              )}
              {account.website && (
                <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{account.website}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {account.joined}</span>
            </div>

            {/* Stats */}
            <div className="mt-4 flex gap-6 text-sm">
              <Link href={`/dashboard/profile/${account.username}/followers`} className="hover:text-primary transition">
                <span className="font-bold text-foreground">
                  {(account.followersCount + (isFollowing ? 1 : 0)).toLocaleString()}
                </span>{' '}
                <span className="text-muted-foreground">followers</span>
              </Link>
              <Link href={`/dashboard/profile/${account.username}/following`} className="hover:text-primary transition">
                <span className="font-bold text-foreground">
                  {account.followingCount.toLocaleString()}
                </span>{' '}
                <span className="text-muted-foreground">following</span>
              </Link>
              {account.tracks !== null && (
                <div><span className="font-bold text-foreground">{account.tracks}</span> <span className="text-muted-foreground">tracks</span></div>
              )}
              <div><span className="font-bold text-foreground">{account.posts}</span> <span className="text-muted-foreground">posts</span></div>
            </div>

            <p className="mt-2 text-xs text-primary/80 font-medium">{account.genre}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-8 border-b border-border flex gap-8">
        {tabBtn('all', 'All Content')}
        {account.role === 'artist' && tabBtn('music', 'Music')}
        {tabBtn('posts', 'Posts')}
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4 pb-12">
        {/* Tracks */}
        {showTracks && account.dummyTracks?.map(track => (
          <Card key={track.id} className="p-5 border-border hover:border-primary/40 transition">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{track.title}</h3>
                  <p className="text-xs text-primary/80 mt-0.5">{track.genre}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{track.plays} plays</span>
                    <span>{track.likes} likes</span>
                    <span>{track.date}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/10 flex-shrink-0">
                  <Play className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Posts */}
        {showPosts && account.dummyPosts?.map(post => (
          <Card key={post.id} className="p-5 border-border hover:border-primary/40 transition">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${account.avatar_color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {account.initials}
              </div>
              <div>
                <p className="font-semibold text-sm">{account.full_name}</p>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex gap-5 text-xs text-muted-foreground border-t border-border pt-3">
              <button className="flex items-center gap-1.5 hover:text-primary transition">
                <Heart className="h-4 w-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition">
                <MessageSquare className="h-4 w-4" /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </Card>
        ))}

        {(!account.dummyTracks?.length && !account.dummyPosts?.length) && (
          <p className="text-muted-foreground text-center py-12">No content yet.</p>
        )}
      </div>
    </main>
  )
}

// ── Real profile page ───────────────────────────────────────────────────────
export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)

  // Check dummy accounts first
  const dummyAccount = getDummyAccount(username)
  if (dummyAccount) return <DummyProfilePage account={dummyAccount} />

  // Otherwise load from Supabase
  const [isFollowing, setIsFollowing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'post'>('all')
  const [profileTracks, setProfileTracks] = useState<any[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData.user) {
        setCurrentUser(authData.user)
      }

      const { data: profileData } = await supabase.from('users').select('*').eq('username', username).single()

      if (profileData) {
        const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id)
        const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
        const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profileData.id)
        const { count: tracksCount } = await supabase.from('music_tracks').select('*', { count: 'exact', head: true }).eq('artist_id', profileData.id)

        setUser({
          id: profileData.id,
          username: profileData.username,
          fullName: profileData.full_name,
          email: profileData.email,
          avatar: profileData.avatar_url,
          cover: profileData.banner_url,
          bio: profileData.bio || 'Music enthusiast',
          userType: profileData.role,
          followersCount: followersCount || 0,
          followingCount: (followingCount || 0) + (authData.user ? getDummyFollows(authData.user.id).length : 0),
          postsCount: (postsCount || 0) + (tracksCount || 0),
        })

        const { data: tracksData } = await supabase.from('music_tracks').select('*').eq('artist_id', profileData.id).order('created_at', { ascending: false })
        if (tracksData) {
          setProfileTracks(tracksData.map(t => ({
            id: t.id, type: 'music', title: t.title, description: t.description,
            audioUrl: t.audio_url, plays: t.play_count || 0, likes: t.likes_count || 0,
            comments: t.comments_count || 0, createdAt: new Date(t.created_at).toLocaleDateString()
          })))
        }
      }

      if (authData.user) {
        if (profileData && authData.user.id === profileData.id) {
          setIsOwnProfile(true)
        } else if (profileData) {
          // Check if current user is following this profile
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', authData.user.id)
            .eq('following_id', profileData.id)
            .single()
          
          if (followData) setIsFollowing(true)
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [username])

  const handleFollowToggle = async () => {
    if (!user || !currentUser) return
    const supabase = createClient()
    
    // Optimistic UI update
    setIsFollowing(!isFollowing)
    setUser((prev: any) => ({
      ...prev,
      followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }))

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', user.id)
      
      if (error) {
        console.error('Follow delete error:', error)
        alert('Failed to unfollow: ' + error.message)
        setIsFollowing(true) // revert
        setUser((prev: any) => ({ ...prev, followersCount: prev.followersCount + 1 }))
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: user.id })
        
      if (error) {
        console.error('Follow insert error:', error)
        alert('Failed to follow: ' + error.message)
        setIsFollowing(false) // revert
        setUser((prev: any) => ({ ...prev, followersCount: prev.followersCount - 1 }))
      }
    }
  }

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null) }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }; setPlayingId(id) }
  }

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  if (!user) return (
    <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">User not found</h1>
      <p className="text-muted-foreground">The user @{username} does not exist.</p>
      <Link href="/dashboard"><Button>Return Home</Button></Link>
    </div>
  )

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      <UserProfileCard
        userId={user.id} username={user.username} fullName={user.fullName}
        avatar={user.avatar} cover={user.cover} bio={user.bio} userType={user.userType}
        followersCount={user.followersCount} followingCount={user.followingCount}
        postsCount={user.postsCount} isFollowing={isFollowing}
        onFollow={handleFollowToggle} isOwnProfile={isOwnProfile}
      />

      <div className="mt-8 border-b border-border flex gap-8">
        {(['all', 'music', 'post'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-4 transition ${activeTab === tab ? 'font-semibold border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'all' ? 'All Content' : tab === 'music' ? 'Music' : 'Posts'}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {profileTracks.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No content available.</p>
        ) : profileTracks.filter(c => activeTab === 'all' || c.type === activeTab).map((content) => (
          <Card key={content.id} className="p-6 border-border hover:border-primary/50 transition">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-4">
                <Button variant="default" size="icon"
                  onClick={() => togglePlay(content.id, content.audioUrl)}
                  className={`w-16 h-16 rounded-lg flex-shrink-0 transition-colors ${playingId === content.id ? 'bg-primary text-primary-foreground animate-pulse shadow-lg shadow-primary/40' : 'bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground'}`}>
                  {playingId === content.id ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 ml-1 fill-current" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1 truncate">{content.title}</h3>
                  <div className="flex gap-6 text-sm text-muted-foreground mt-2">
                    <span>{content.plays.toLocaleString()} plays</span>
                    <span>{content.likes} likes</span>
                    <span>{content.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
