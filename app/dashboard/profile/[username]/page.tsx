'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserProfileCard } from '@/components/user-profile-card'
import { Music, MessageSquare, Heart, Share2, Loader2, Play, Pause, MapPin, Globe, Calendar, Headphones, UserPlus, Check, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDummyAccount, type DummyAccount, DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'
import { isDummyFollowing, toggleDummyFollow, getDummyFollows } from '@/lib/dummy-follows'

// ── Shared Helpers ──────────────────────────────────────────────────────────

const COMMENT_TEXTS = ['This is absolutely incredible! 🔥', 'Love this so much, keep creating! 🎶', 'Best thing I\'ve heard all week', 'Wow the production quality here is insane', 'This hits different at midnight fr', 'The vibe is completely unmatched ✨']
const COMMENT_TIMES = ['2h ago', '5h ago', '8h ago', '1d ago', '2d ago']

function generateDummyComments(count: number) {
  const shown = Math.min(count, 5)
  return Array.from({ length: shown }, (_, i) => ({
    author: DUMMY_ACCOUNTS[i % DUMMY_ACCOUNTS.length].full_name,
    avatar: null,
    text: COMMENT_TEXTS[i % COMMENT_TEXTS.length],
    ts: COMMENT_TIMES[i % COMMENT_TIMES.length],
  }))
}

function parseDummyDate(date: string): number {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const [month, year] = date.split(' ')
  return new Date(parseInt(year), months[month] ?? 0, 15).getTime()
}

// ── Dummy profile view ──────────────────────────────────────────────────────
function DummyProfilePage({ account }: { account: DummyAccount }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'posts'>('all')

  const [feedItems, setFeedItems] = useState<any[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [commentState, setCommentState] = useState<Record<string, { open: boolean; text: string; list: any[]; loading?: boolean }>>({})
  const [shareItem, setShareItem] = useState<any>(null)
  const [shareThought, setShareThought] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setCurrentUser(data)
        setIsFollowing(isDummyFollowing(account.username, user.id))
      }

      const unifiedArray: any[] = []
      
      account.dummyTracks?.forEach(track => {
        unifiedArray.push({
          id: `dummy-track-${track.id}`, type: 'music', isDummy: true,
          author: { id: account.id, name: account.full_name, username: account.username, avatarColor: account.avatar_color, initials: account.initials, userType: account.role },
          title: track.title, description: `${track.genre} · ${account.full_name}`, musicUrl: null,
          plays: parseInt(track.plays.replace(/[^0-9]/g, '')) * (track.plays.includes('K') ? 1000 : 1),
          likes: parseInt(track.likes.replace(/[^0-9]/g, '')) * (track.likes.includes('K') ? 1000 : 1),
          comments: 0, shares: 0, timestampRaw: parseDummyDate(track.date), timestamp: track.date, isLiked: false,
        })
      })

      account.dummyPosts?.forEach(post => {
        unifiedArray.push({
          id: `dummy-post-${post.id}`, type: 'post', isDummy: true,
          author: { id: account.id, name: account.full_name, username: account.username, avatarColor: account.avatar_color, initials: account.initials, userType: account.role },
          content: post.content, imageUrl: null,
          likes: parseInt(post.likes.replace(/[^0-9]/g, '')) * (post.likes.includes('K') ? 1000 : 1),
          comments: parseInt(post.comments.replace(/[^0-9]/g, '')),
          shares: 0, timestampRaw: parseDummyDate(post.date), timestamp: post.date, isLiked: false,
        })
      })

      unifiedArray.sort((a, b) => b.timestampRaw - a.timestampRaw)
      setFeedItems(unifiedArray)
    }
    loadUser()
  }, [account.username, account])

  const handleFollow = () => {
    if (!currentUser) return
    const nowFollowing = toggleDummyFollow(account.username, currentUser.id)
    setIsFollowing(nowFollowing)
  }

  const handleReply = (id: string, authorName: string) => {
    setCommentState(prev => ({
      ...prev,
      [id]: { ...prev[id], text: `@${authorName} ` }
    }))
  }

  const togglePlay = (id: string, url: string | null) => {
    if (!url) return
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null) }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }; setPlayingId(id) }
  }

  const handleLike = (id: string) => {
    setFeedItems(items => items.map(i => i.id === id ? { ...i, isLiked: !i.isLiked, likes: i.isLiked ? i.likes - 1 : i.likes + 1 } : i))
  }

  const toggleComments = (id: string) => {
    const item = feedItems.find(i => i.id === id)
    setCommentState(prev => {
      const existing = prev[id]
      if (existing?.open) return { ...prev, [id]: { ...existing, open: false } }
      const initialList = ((item?.comments ?? 0) > 0 && (!existing?.list || existing.list.length === 0)) ? generateDummyComments(item!.comments) : (existing?.list ?? [])
      return { ...prev, [id]: { open: true, text: existing?.text ?? '', list: initialList, loading: false } }
    })
  }

  const submitComment = (id: string) => {
    const text = commentState[id]?.text?.trim()
    if (!text || !currentUser) return
    const newComment = { author: currentUser.full_name, avatar: currentUser.avatar_url, text, ts: 'Just now' }
    setCommentState(prev => ({ ...prev, [id]: { ...prev[id], text: '', list: [newComment, ...(prev[id]?.list ?? [])] } }))
    setFeedItems(items => items.map(i => i.id === id ? { ...i, comments: i.comments + 1 } : i))
  }

  const execShare = async () => {
    if (!currentUser || !shareItem) return
    setIsSharing(true)
    try {
      const supabase = createClient()
      const dbId = shareItem.id.replace(/^(dummy-post-|dummy-track-)/, '')
      const content = `[SHARE:${shareItem.type}:${dbId}]\n${shareThought}`
      await supabase.from('posts').insert({ user_id: currentUser.id, content })
      setShareItem(null); setShareThought('')
    } catch(e) { console.error(e) } finally { setIsSharing(false) }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Share Modal */}
      {shareItem && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Share to your feed</h2>
            <textarea placeholder="Add your thoughts about this..." className="w-full min-h-[100px] p-3 mb-4 rounded-lg bg-muted border border-border focus:border-primary outline-none transition resize-none" value={shareThought} onChange={e => setShareThought(e.target.value)} />
            <div className="p-4 rounded-xl border border-border bg-muted/30 mb-6">
              <p className="font-semibold text-sm mb-1">Sharing {shareItem.author?.name}'s {shareItem.type}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{shareItem.title || shareItem.content}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setShareItem(null); setShareThought('') }}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground" onClick={execShare} disabled={isSharing}>
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                Share Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cover banner */}
      <div className={`w-full h-40 rounded-2xl bg-gradient-to-r ${account.avatar_color} mb-0 opacity-60`} />

      {/* Profile header card */}
      <Card className="border-border -mt-10 mx-2 p-6 relative">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                      <Headphones className="h-3 w-3" /> Listener
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">@{account.username}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/dashboard/messages?user=${account.username}`}>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-muted text-foreground border border-border hover:bg-muted/80">
                    <MessageSquare className="h-4 w-4" /> Message
                  </button>
                </Link>
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isFollowing ? 'bg-muted text-muted-foreground border border-border' : 'bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm shadow-primary/25'
                  }`}
                >
                  {isFollowing ? <><Check className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{account.bio}</p>
            <div className="mt-4 flex flex-wrap gap-4 sm:gap-6 text-sm">
              <Link href={`/dashboard/profile/${account.username}/followers`} className="hover:text-primary transition">
                <span className="font-bold text-foreground">{(account.followersCount + (isFollowing ? 1 : 0)).toLocaleString()}</span> <span className="text-muted-foreground">followers</span>
              </Link>
              <Link href={`/dashboard/profile/${account.username}/following`} className="hover:text-primary transition">
                <span className="font-bold text-foreground">{account.followingCount.toLocaleString()}</span> <span className="text-muted-foreground">following</span>
              </Link>
              <div><span className="font-bold text-foreground">{account.posts}</span> <span className="text-muted-foreground">posts</span></div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8 border-b border-border flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
        {['all', 'music', 'posts'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 transition font-medium ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'all' ? 'All Content' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4 pb-12">
        {feedItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No content yet.</p>
        ) : feedItems.filter(i => activeTab === 'all' || (activeTab === 'music' && i.type === 'music') || (activeTab === 'posts' && i.type === 'post')).map(item => (
          <Card key={item.id} className="border-border hover:border-primary/50 transition">
            <div className="p-4 border-b border-border">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.author.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {item.author.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{item.author.name}</span>
                    <span className="text-muted-foreground text-sm">@{item.author.username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.timestamp}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {item.type === 'post' && (
                <p className="text-foreground mb-4 whitespace-pre-wrap">{item.content}</p>
              )}

              {item.type === 'music' && (
                <>
                  {item.description && <p className="text-foreground mb-4 whitespace-pre-wrap">{item.description}</p>}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 mb-4 border border-primary/20">
                    <div className="flex items-center gap-4">
                      <Button variant="default" size="icon" disabled className="w-16 h-16 rounded-lg bg-primary/20 text-primary">
                        <Play className="h-8 w-8 ml-1 fill-current" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{Number(item.plays).toLocaleString()} plays</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex gap-4">
              <span>{Number(item.likes).toLocaleString()} likes</span>
              <span>{item.comments} comments</span>
              <span>{item.shares} shares</span>
            </div>

            <div className="p-2 sm:p-3 border-t border-border flex gap-1 sm:gap-2">
              <button onClick={() => handleLike(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium transition-all ${item.isLiked ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={item.isLiked ? 'currentColor' : 'none'} />
                <span className="text-xs sm:text-sm">Like</span>
              </button>
              <button onClick={() => toggleComments(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium transition-all ${commentState[item.id]?.open ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" fill={commentState[item.id]?.open ? 'currentColor' : 'none'} />
                <span className="text-xs sm:text-sm">Comment</span>
              </button>
              <button onClick={() => setShareItem(item)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Share</span>
              </button>
            </div>

            {commentState[item.id]?.open && (
              <div className="border-t border-border px-4 pb-5 pt-4 bg-muted/10">
                <div className="flex gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                    {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{currentUser?.full_name?.charAt(0) || 'Y'}</span>}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input placeholder="Write a comment…" value={commentState[item.id]?.text ?? ''} onChange={e => setCommentState(prev => ({ ...prev, [item.id]: { ...prev[item.id], text: e.target.value } }))} onKeyDown={e => { if (e.key === 'Enter') submitComment(item.id) }} className="h-10 text-sm bg-background border-border" />
                    <button onClick={() => submitComment(item.id)} disabled={!commentState[item.id]?.text?.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {(commentState[item.id]?.list ?? []).length > 0 && (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {(commentState[item.id]?.list ?? []).map((c, i) => (
                      <div key={i} className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden shadow-sm">
                          {c.avatar ? <img src={c.avatar} alt="avatar" className="w-full h-full object-cover" /> : c.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-background border border-border shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-[90%]">
                            <span className="font-bold text-sm text-foreground block mb-0.5">{c.author}</span>
                            <span className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 ml-1">
                            <p className="text-[11px] font-medium text-muted-foreground">{c.ts}</p>
                            <button onClick={() => handleReply(item.id, c.author.replace(/\s+/g, ''))} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  )
}

// ── Real profile page ───────────────────────────────────────────────────────
export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const dummyAccount = getDummyAccount(username)
  if (dummyAccount) return <DummyProfilePage account={dummyAccount} />

  const [isFollowing, setIsFollowing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'post'>('all')
  
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [sharedMap, setSharedMap] = useState<Record<string, any>>({})
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [commentState, setCommentState] = useState<Record<string, { open: boolean; text: string; list: any[]; loading?: boolean }>>({})
  const [shareItem, setShareItem] = useState<any>(null)
  const [shareThought, setShareThought] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    let likedPostIds = new Set<string>()
    let likedTrackIds = new Set<string>()

    if (authData.user) {
      const { data } = await supabase.from('users').select('*').eq('id', authData.user.id).single()
      setCurrentUser(data)

      const { data: myLikes } = await supabase.from('likes').select('post_id, track_id').eq('user_id', authData.user.id)
      likedPostIds = new Set(myLikes?.map(l => l.post_id).filter(Boolean))
      likedTrackIds = new Set(myLikes?.map(l => l.track_id).filter(Boolean))
    }

    const { data: profileData } = await supabase.from('users').select('*').eq('username', username).single()

    if (profileData) {
      const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id)
      const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
      const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profileData.id)
      const { count: tracksCount } = await supabase.from('music_tracks').select('*', { count: 'exact', head: true }).eq('artist_id', profileData.id)

      setUser({
        id: profileData.id, username: profileData.username, fullName: profileData.full_name,
        email: profileData.email, avatar: profileData.avatar_url, cover: profileData.banner_url,
        bio: profileData.bio || 'Music enthusiast', userType: profileData.role,
        followersCount: followersCount || 0, followingCount: (followingCount || 0) + (authData.user ? getDummyFollows(authData.user.id).length : 0),
        postsCount: (postsCount || 0) + (tracksCount || 0),
      })

      const [tracksData, postsData] = await Promise.all([
        supabase.from('music_tracks').select('*, author:users(*)').eq('artist_id', profileData.id),
        supabase.from('posts').select('*, author:users(*)').eq('user_id', profileData.id)
      ])
      
      const combined = []
      if (tracksData.data) {
        combined.push(...tracksData.data.map((t: any) => ({
          id: `track-${t.id}`, dbId: t.id, type: 'music', isDummy: false,
          author: { id: t.author.id, name: t.author.full_name, username: t.author.username, avatar: t.author.avatar_url, userType: t.author.role },
          title: t.title, description: t.description || '', musicUrl: t.audio_url,
          plays: t.play_count || 0, likes: t.likes_count || 0, comments: t.comments_count || 0, shares: 0,
          timestampRaw: new Date(t.created_at).getTime(), timestamp: new Date(t.created_at).toLocaleDateString(),
          isLiked: likedTrackIds.has(t.id)
        })))
      }
      if (postsData.data) {
        combined.push(...postsData.data.map((p: any) => ({
          id: `post-${p.id}`, dbId: p.id, type: 'post', isDummy: false,
          author: { id: p.author.id, name: p.author.full_name, username: p.author.username, avatar: p.author.avatar_url, userType: p.author.role },
          content: p.content, imageUrl: p.image_url,
          likes: p.likes_count || 0, comments: p.comments_count || 0, shares: p.shares_count || 0,
          timestampRaw: new Date(p.created_at).getTime(), timestamp: new Date(p.created_at).toLocaleDateString(),
          isLiked: likedPostIds.has(p.id)
        })))
      }
      combined.sort((a, b) => b.timestampRaw - a.timestampRaw)
      setFeedItems(combined)

      // Build sharedMap: pre-seed from already-loaded items first
      const newSharedMap: Record<string, any> = {}
      combined.forEach((i: any) => {
        if (i.dbId) {
          if (i.type === 'post') newSharedMap[i.dbId] = { content: i.content, author: i.author?.name, img: i.imageUrl }
          else if (i.type === 'music') newSharedMap[i.dbId] = { title: i.title, author: i.author?.name }
        }
      })

      // Fetch any originals not already in the map
      const missingIds = new Set<string>()
      combined.forEach((i: any) => {
        if (i.content) {
          const match = i.content.match(/\[SHARE:(post|music|show):([^\]]+)\]/)
          if (match && !newSharedMap[match[2]]) missingIds.add(match[2])
        }
      })
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
      const uuidsToFetch = Array.from(missingIds).filter(isUUID)
      if (uuidsToFetch.length > 0) {
        const [postsRes, tracksRes, showsRes] = await Promise.all([
          supabase.from('posts').select('id, content, image_url, author:user_id(full_name)').in('id', uuidsToFetch),
          supabase.from('music_tracks').select('id, title, author:artist_id(full_name)').in('id', uuidsToFetch),
          supabase.from('shows').select('id, title, artist:user_id(full_name)').in('id', uuidsToFetch)
        ])
        postsRes.data?.forEach((p: any) => { newSharedMap[p.id] = { content: p.content, author: p.author?.full_name, img: p.image_url } })
        tracksRes.data?.forEach((t: any) => { newSharedMap[t.id] = { title: t.title, author: t.author?.full_name } })
        showsRes.data?.forEach((s: any) => { newSharedMap[s.id] = { title: s.title, author: s.artist?.full_name } })
      }
      setSharedMap(newSharedMap)

      if (authData.user) {
        if (authData.user.id === profileData.id) {
          setIsOwnProfile(true)
        } else {
          const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', authData.user.id).eq('following_id', profileData.id).single()
          if (followData) setIsFollowing(true)
        }
      }
    }
    setLoading(false)
  }, [username])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleFollowToggle = async () => {
    if (!user || !currentUser) return
    const supabase = createClient()
    
    setIsFollowing(!isFollowing)
    setUser((prev: any) => ({ ...prev, followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1 }))

    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', user.id)
      if (error) { alert('Failed to unfollow'); setIsFollowing(true); setUser((prev: any) => ({ ...prev, followersCount: prev.followersCount + 1 })) }
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: user.id })
      if (error) { alert('Failed to follow'); setIsFollowing(false); setUser((prev: any) => ({ ...prev, followersCount: prev.followersCount - 1 })) }
    }
  }

  const handleReply = (id: string, authorName: string) => {
    setCommentState(prev => ({ ...prev, [id]: { ...prev[id], text: `@${authorName} ` } }))
  }

  const togglePlay = (id: string, url: string | null) => {
    if (!url) return
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null) }
    else { if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }; setPlayingId(id) }
  }

  const toggleComments = async (id: string, dbId?: string, type?: string) => {
    setCommentState(prev => {
      const existing = prev[id]
      if (existing?.open) return { ...prev, [id]: { ...existing, open: false } }
      return { ...prev, [id]: { open: true, text: existing?.text ?? '', list: existing?.list ?? [], loading: (!existing?.list || existing.list.length === 0) } }
    })

    if (dbId) {
       const supabase = createClient()
       const column = type === 'music' ? 'track_id' : 'post_id'
       const { data } = await supabase.from('comments').select('*, user:user_id(*)').eq(column, dbId).order('created_at', { ascending: false })
       if (data) {
         setCommentState(prev => ({
           ...prev, [id]: { ...prev[id], loading: false, list: data.map(c => ({ author: c.user.full_name, avatar: c.user.avatar_url, text: c.content, ts: new Date(c.created_at).toLocaleDateString() })) }
         }))
       }
    }
  }

  const submitComment = async (id: string, dbId?: string, type?: string) => {
    const text = commentState[id]?.text?.trim()
    if (!text || !currentUser) return
    
    const newComment = { author: currentUser.full_name, avatar: currentUser.avatar_url, text, ts: 'Just now' }
    setCommentState(prev => ({ ...prev, [id]: { ...prev[id], text: '', list: [newComment, ...(prev[id]?.list ?? [])] } }))
    setFeedItems(items => items.map(i => i.id === id ? { ...i, comments: i.comments + 1 } : i))

    if (dbId) {
      const supabase = createClient()
      const column = type === 'music' ? 'track_id' : 'post_id'
      await supabase.from('comments').insert({ user_id: currentUser.id, [column]: dbId, content: text })
    }
  }

  const handleLike = async (id: string, dbId?: string, type?: string) => {
    if (!currentUser) return
    const item = feedItems.find(i => i.id === id)
    if (!item) return
    const isLiked = item.isLiked
    
    setFeedItems(items => items.map(i => i.id === id ? { ...i, isLiked: !isLiked, likes: isLiked ? i.likes - 1 : i.likes + 1 } : i))

    if (dbId) {
       const supabase = createClient()
       const column = type === 'music' ? 'track_id' : 'post_id'
       if (!isLiked) {
         await supabase.from('likes').insert({ user_id: currentUser.id, [column]: dbId })
       } else {
         await supabase.from('likes').delete().eq('user_id', currentUser.id).eq(column, dbId)
       }
    }
  }

  const execShare = async () => {
    if (!currentUser || !shareItem) return
    setIsSharing(true)
    try {
      const supabase = createClient()
      const content = `[SHARE:${shareItem.type}:${shareItem.dbId}]\n${shareThought}`
      await supabase.from('posts').insert({ user_id: currentUser.id, content })
      setShareItem(null); setShareThought('')
      alert('Shared successfully to your feed!')
    } catch(e) { console.error(e) } finally { setIsSharing(false) }
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

      {/* Share Modal */}
      {shareItem && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Share to your feed</h2>
            <textarea placeholder="Add your thoughts about this..." className="w-full min-h-[100px] p-3 mb-4 rounded-lg bg-muted border border-border focus:border-primary outline-none transition resize-none" value={shareThought} onChange={e => setShareThought(e.target.value)} />
            <div className="p-4 rounded-xl border border-border bg-muted/30 mb-6">
              <p className="font-semibold text-sm mb-1">Sharing {shareItem.author?.name}'s {shareItem.type}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{shareItem.title || shareItem.content}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setShareItem(null); setShareThought('') }}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground" onClick={execShare} disabled={isSharing}>
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                Share Now
              </Button>
            </div>
          </Card>
        </div>
      )}

      <UserProfileCard
        userId={user.id} username={user.username} fullName={user.fullName}
        avatar={user.avatar} cover={user.cover} bio={user.bio} userType={user.userType}
        followersCount={user.followersCount} followingCount={user.followingCount}
        postsCount={user.postsCount} isFollowing={isFollowing}
        onFollow={handleFollowToggle} isOwnProfile={isOwnProfile}
      />

      <div className="mt-8 border-b border-border flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
        {(['all', 'music', 'post'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-4 transition ${activeTab === tab ? 'font-semibold border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'all' ? 'All Content' : tab === 'music' ? 'Music' : 'Posts'}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4 pb-12">
        {feedItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No content available.</p>
        ) : feedItems.filter(c => activeTab === 'all' || c.type === activeTab).map((item) => {
          
          let displayContent = item.content
          let sharedInfo = null

          if (item.type === 'post' && item.content) {
            const shareMatch = item.content.match(/\[SHARE:(post|music|show):([^\]]+)\]/)
            if (shareMatch) {
              const [fullMatch, sType, sId] = shareMatch
              displayContent = item.content.replace(fullMatch, '').trim()
              sharedInfo = { type: sType, id: sId }
            }
          }

          return (
            <Card key={item.id} className="p-0 border-border hover:border-primary/50 transition">
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.author.avatar
                      ? <img src={item.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold">{item.author.name.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.author.name}</span>
                      <span className="text-muted-foreground text-sm">@{item.author.username}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.timestamp}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {item.type === 'post' && (
                  <>
                    {displayContent && <p className="text-foreground mb-4 whitespace-pre-wrap">{displayContent}</p>}
                    {sharedInfo && (
                      <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 mb-4 shadow-inner">
                        <p className="text-xs text-primary font-bold mb-2 flex items-center gap-2 uppercase tracking-wide"><Share2 className="w-3.5 h-3.5"/> Reshared {sharedInfo.type}</p>
                        {sharedMap[sharedInfo.id] ? (
                          <div>
                            {sharedMap[sharedInfo.id].author && (
                              <p className="text-xs text-muted-foreground font-semibold mb-1">Original by {sharedMap[sharedInfo.id].author}</p>
                            )}
                            <p className="text-sm font-medium text-foreground line-clamp-3">
                              {sharedMap[sharedInfo.id].content || sharedMap[sharedInfo.id].title || <span className="italic text-muted-foreground">No preview available</span>}
                            </p>
                            {sharedMap[sharedInfo.id].img && (
                              <img src={sharedMap[sharedInfo.id].img} className="w-full max-h-40 object-cover rounded-lg mt-2" />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">Original post could not be loaded.</p>
                        )}
                      </div>
                    )}
                    {item.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-border mt-4">
                        <img src={item.imageUrl} alt="Post attachment" className="w-full max-h-[500px] object-cover" />
                      </div>
                    )}
                  </>
                )}

                {item.type === 'music' && (
                  <>
                    {item.description && <p className="text-foreground mb-4 whitespace-pre-wrap">{item.description}</p>}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 mb-4 border border-primary/20">
                      <div className="flex items-center gap-4">
                        <Button variant="default" size="icon"
                          onClick={() => togglePlay(item.id, item.musicUrl)}
                          className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${playingId === item.id ? 'bg-primary text-white animate-pulse shadow-lg shadow-primary/40' : 'bg-primary/20 text-primary hover:bg-primary hover:text-white'}`}>
                          {playingId === item.id ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 ml-1 fill-current" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{Number(item.plays).toLocaleString()} plays</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex gap-4">
                <span>{Number(item.likes).toLocaleString()} likes</span>
                <span>{item.comments} comments</span>
                <span>{item.shares} shares</span>
              </div>

              <div className="p-2 sm:p-3 border-t border-border flex gap-1 sm:gap-2">
                <button onClick={() => handleLike(item.id, item.dbId, item.type)} className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium transition-all ${item.isLiked ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={item.isLiked ? 'currentColor' : 'none'} />
                  <span className="text-xs sm:text-sm">Like</span>
                </button>
                <button onClick={() => toggleComments(item.id, item.dbId, item.type)} className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium transition-all ${commentState[item.id]?.open ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" fill={commentState[item.id]?.open ? 'currentColor' : 'none'} />
                  <span className="text-xs sm:text-sm">Comment</span>
                </button>
                <button onClick={() => setShareItem(item)} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">Share</span>
                </button>
              </div>

              {commentState[item.id]?.open && (
                <div className="border-t border-border px-4 pb-5 pt-4 bg-muted/10">
                  <div className="flex gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                      {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{currentUser?.full_name?.charAt(0) || 'Y'}</span>}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Input placeholder="Write a comment…" value={commentState[item.id]?.text ?? ''} onChange={e => setCommentState(prev => ({ ...prev, [item.id]: { ...prev[item.id], text: e.target.value } }))} onKeyDown={e => { if (e.key === 'Enter') submitComment(item.id, item.dbId, item.type) }} className="h-10 text-sm bg-background border-border" />
                      <button onClick={() => submitComment(item.id, item.dbId, item.type)} disabled={!commentState[item.id]?.text?.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {commentState[item.id]?.loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : (commentState[item.id]?.list ?? []).length > 0 && (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {(commentState[item.id]?.list ?? []).map((c, i) => (
                        <div key={i} className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden shadow-sm">
                            {c.avatar ? <img src={c.avatar} alt="avatar" className="w-full h-full object-cover" /> : c.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="bg-background border border-border shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-[90%]">
                              <span className="font-bold text-sm text-foreground block mb-0.5">{c.author}</span>
                              <span className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 ml-1">
                              <p className="text-[11px] font-medium text-muted-foreground">{c.ts}</p>
                              <button onClick={() => handleReply(item.id, c.author.replace(/\s+/g, ''))} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </main>
  )
}
