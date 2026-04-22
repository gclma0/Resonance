'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heart, MessageCircle, Share2, Music, Image as ImageIcon, Play, Pause, Loader2, X, UserPlus, Check, Headphones, Users, Send, Link2, Calendar, MapPin, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'
import { getDummyFollows, toggleDummyFollow, isDummyFollowing } from '@/lib/dummy-follows'
import { getStoredShows } from '@/lib/shows-store'

// Show first 6 in the sidebar
const DUMMY_SUGGESTIONS = DUMMY_ACCOUNTS.slice(0, 6)

// Parse "Apr 2026" -> timestamp for sorting
function parseDummyDate(date: string): number {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const [month, year] = date.split(' ')
  return new Date(parseInt(year), months[month] ?? 0, 15).getTime()
}

const COMMENT_TEXTS = [
  'This is absolutely incredible! 🔥',
  'Love this so much, keep creating! 🎶',
  'Best thing I\'ve heard all week',
  'Wow the production quality here is insane',
  'This hits different at midnight fr',
  'The vibe is completely unmatched ✨',
  'I\'ve had this on repeat all day long',
  'Genuinely goosebumps listening to this',
  'This is everything. Thank you for sharing.',
  'The energy in this is unreal 🎶',
  'Already added this to my playlist',
  'Pure art. Nothing less.',
  'This just made my whole week 💙',
  'The talent here is on another level',
  'Can\'t stop listening! More please 🙌',
]
const COMMENT_TIMES = ['2h ago', '5h ago', '8h ago', '1d ago', '2d ago', '3d ago', '1w ago', 'Apr 20', 'Apr 18']

function generateDummyComments(count: number, accounts: typeof DUMMY_ACCOUNTS) {
  const shown = Math.min(count, 8)
  return Array.from({ length: shown }, (_, i) => ({
    author: accounts[i % accounts.length].full_name,
    text: COMMENT_TEXTS[i % COMMENT_TEXTS.length],
    ts: COMMENT_TIMES[i % COMMENT_TIMES.length],
  }))
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Composer state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [postContent, setPostContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'audio' | null>(null)
  const [trackTitle, setTrackTitle] = useState('')
  const [trackGenre, setTrackGenre] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Sidebar follow state (reads from localStorage)
  const [sidebarFollowed, setSidebarFollowed] = useState<Record<string, boolean>>({})

  // Comments state: { [itemId]: { open: boolean, text: string, list: {author,text,ts}[] } }
  const [commentState, setCommentState] = useState<Record<string, { open: boolean; text: string; list: { author: string; text: string; ts: string }[] }>>({})
  // Share toast
  const [sharedId, setSharedId] = useState<string | null>(null)

  const toggleComments = (id: string) => {
    const item = feedItems.find(i => i.id === id)
    setCommentState(prev => {
      const existing = prev[id]
      // Pre-seed dummy comments when opening for the first time
      if (!existing?.open && (item?.comments ?? 0) > 0 && (!existing?.list || existing.list.length === 0)) {
        return { ...prev, [id]: { open: true, text: '', list: generateDummyComments(item!.comments, DUMMY_ACCOUNTS) } }
      }
      return { ...prev, [id]: { open: !existing?.open, text: existing?.text ?? '', list: existing?.list ?? [] } }
    })
  }

  const submitComment = (id: string) => {
    const text = commentState[id]?.text?.trim()
    if (!text) return
    const newComment = { 
      author: currentUser?.full_name || 'You', 
      avatar: currentUser?.avatar_url || null,
      text, 
      ts: 'Just now' 
    }
    setCommentState(prev => ({
      ...prev,
      [id]: { open: true, text: '', list: [newComment, ...(prev[id]?.list ?? [])] },
    }))
    setFeedItems(items => items.map(item =>
      item.id === id ? { ...item, comments: item.comments + 1 } : item
    ))
  }

  const handleShare = (id: string, username: string) => {
    const url = `${window.location.origin}/dashboard/profile/${username}`
    navigator.clipboard.writeText(url).catch(() => {})
    setSharedId(id)
    setTimeout(() => setSharedId(null), 2000)
  }

  // Initialise sidebar follow state from localStorage on mount
  useEffect(() => {
    if (!currentUser) return
    const init: Record<string, boolean> = {}
    DUMMY_SUGGESTIONS.forEach(p => { init[p.id] = isDummyFollowing(p.username, currentUser.id) })
    setSidebarFollowed(init)
  }, [currentUser])

  const handleSidebarFollow = (id: string, username: string) => {
    if (!currentUser) return
    toggleDummyFollow(username, currentUser.id)
    setSidebarFollowed(prev => ({ ...prev, [id]: !prev[id] }))
    // Reload feed so the newly followed account's posts appear
    loadFeed()
  }

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch current user profile
    if (user && !currentUser) {
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (userData) setCurrentUser(userData)
    }

    const unifiedArray: any[] = []

    if (user) {
      // ── Real follows ──────────────────────────────────────────────────────
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
      const followingIds = follows?.map(f => f.following_id) || []
      const feedUserIds = [...followingIds, user.id]

      if (feedUserIds.length > 0) {
        const [tracksRes, postsRes] = await Promise.all([
          supabase.from('music_tracks').select('*, author:users(*)').in('artist_id', feedUserIds),
          supabase.from('posts').select('*, author:users(*)').in('user_id', feedUserIds),
        ])

        if (tracksRes.data) {
          unifiedArray.push(...tracksRes.data.map((t: any) => ({
            id: `track-${t.id}`,
            dbId: t.id,
            type: 'music',
            author: {
              id: t.author.id,
              name: t.author.full_name,
              username: t.author.username,
              avatar: t.author.avatar_url,
              userType: t.author.role,
            },
            title: t.title,
            description: t.description || '',
            musicUrl: t.audio_url,
            plays: t.play_count || 0,
            likes: t.likes_count || 0,
            comments: t.comments_count || 0,
            shares: 0,
            timestampRaw: new Date(t.created_at).getTime(),
            timestamp: new Date(t.created_at).toLocaleDateString(),
            isLiked: false,
          })))
        }

        if (postsRes.data) {
          unifiedArray.push(...postsRes.data.map((p: any) => ({
            id: `post-${p.id}`,
            dbId: p.id,
            type: 'post',
            author: {
              id: p.author.id,
              name: p.author.full_name,
              username: p.author.username,
              avatar: p.author.avatar_url,
              userType: p.author.role,
            },
            content: p.content,
            imageUrl: p.image_url,
            likes: p.likes_count || 0,
            comments: p.comments_count || 0,
            shares: p.shares_count || 0,
            timestampRaw: new Date(p.created_at).getTime(),
            timestamp: new Date(p.created_at).toLocaleDateString(),
            isLiked: false,
          })))
        }
      }
    }

    // ── Dummy follows (always load, regardless of auth) ───────────────────
    const dummyFollowedUsernames = user ? getDummyFollows(user.id) : []
    const followedDummyAccounts = DUMMY_ACCOUNTS.filter(a =>
      dummyFollowedUsernames.includes(a.username)
    )

    for (const account of followedDummyAccounts) {
      // Inject dummy tracks
      account.dummyTracks?.forEach(track => {
        unifiedArray.push({
          id: `dummy-track-${track.id}`,
          type: 'music',
          isDummy: true,
          author: {
            id: account.id,
            name: account.full_name,
            username: account.username,
            avatar: null,
            avatarColor: account.avatar_color,
            initials: account.initials,
            userType: account.role,
          },
          title: track.title,
          description: `${track.genre} · ${account.full_name}`,
          musicUrl: null,
          plays: parseInt(track.plays.replace(/[^0-9]/g, '')) * (track.plays.includes('K') ? 1000 : 1),
          likes: parseInt(track.likes.replace(/[^0-9]/g, '')) * (track.likes.includes('K') ? 1000 : 1),
          comments: 0,
          shares: 0,
          timestampRaw: parseDummyDate(track.date),
          timestamp: track.date,
          isLiked: false,
        })
      })

      // Inject dummy posts
      account.dummyPosts?.forEach(post => {
        unifiedArray.push({
          id: `dummy-post-${post.id}`,
          type: 'post',
          isDummy: true,
          author: {
            id: account.id,
            name: account.full_name,
            username: account.username,
            avatar: null,
            avatarColor: account.avatar_color,
            initials: account.initials,
            userType: account.role,
          },
          content: post.content,
          imageUrl: null,
          likes: parseInt(post.likes.replace(/[^0-9]/g, '')) * (post.likes.includes('K') ? 1000 : 1),
          comments: parseInt(post.comments.replace(/[^0-9]/g, '')),
          shares: 0,
          timestampRaw: parseDummyDate(post.date),
          timestamp: post.date,
          isLiked: false,
        })
      })
    }

    // ── Show announcements from localStorage ──────────────────────────────
    const storedShows = getStoredShows()
    storedShows.forEach(show => {
      const showTs = new Date(show.date).getTime()
      unifiedArray.push({
        id: `show-${show.id}`,
        type: 'show',
        isDummy: false,
        author: {
          id: show.artistUsername,
          name: show.artistName,
          username: show.artistUsername,
          avatar: null,
          userType: 'artist',
        },
        showTitle: show.title,
        showDate: new Date(show.date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        }),
        showLocation: show.location,
        showDescription: show.description,
        showPriceUSD: show.ticketPrice.usd,
        showPriceBDT: show.ticketPrice.bdt,
        showTicketsLeft: show.totalTickets - show.ticketsSold,
        likes: 0,
        comments: 0,
        shares: 0,
        timestampRaw: show.createdAt,
        timestamp: new Date(show.createdAt).toLocaleDateString(),
        isLiked: false,
        isUpcoming: showTs >= Date.now(),
      })
    })

    unifiedArray.sort((a, b) => b.timestampRaw - a.timestampRaw)
    setFeedItems(unifiedArray)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  const togglePlay = (id: string, url: string | null) => {
    if (!url) return
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }
      setPlayingId(id)
    }
  }

  const handleLike = (id: string) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    )
  }

  const handlePost = async () => {
    if (!postContent.trim() && !mediaFile) return
    setIsPosting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('No authentication session found.'); setIsPosting(false); return }

    try {
      if (mediaType === 'audio' && mediaFile) {
        if (!trackTitle || !trackGenre) { alert('Title and genre are required to upload an audio track.'); setIsPosting(false); return }
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('music').upload(fileName, mediaFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(fileName)
        await supabase.from('music_tracks').insert({ artist_id: user.id, title: trackTitle, genre: trackGenre, description: postContent, audio_url: publicUrl })
      } else if (mediaType === 'image' && mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('post_images').upload(fileName, mediaFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(fileName)
        await supabase.from('posts').insert({ user_id: user.id, content: postContent, image_url: publicUrl })
      } else {
        await supabase.from('posts').insert({ user_id: user.id, content: postContent })
      }
      setPostContent(''); setMediaFile(null); setMediaType(null); setTrackTitle(''); setTrackGenre('')
      loadFeed()
    } catch (e: any) {
      alert('Error posting: ' + e.message)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="w-full py-8 px-4">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="max-w-6xl mx-auto flex gap-6 items-start">

        {/* ── Main Feed Column ───────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-4">Feed</h1>

          {/* Create Post */}
          <Card className="mb-4 p-6 border-border">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentUser?.avatar_url
                  ? <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold">{currentUser?.full_name?.charAt(0) || 'Y'}</span>}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="Share your thoughts about music..."
                  className="w-full min-h-[80px] p-3 mb-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                />

                {mediaFile && (
                  <div className="mb-4 p-4 rounded-lg border border-border bg-muted/20 relative">
                    <Button variant="ghost" size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-destructive hover:text-white"
                      onClick={() => { setMediaFile(null); setMediaType(null) }}>
                      <X className="h-4 w-4" />
                    </Button>
                    {mediaType === 'image' && (
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium">{mediaFile.name} (Image Attached)</span>
                      </div>
                    )}
                    {mediaType === 'audio' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                          <Music className="h-6 w-6 text-primary" />
                          <span className="text-sm font-medium">{mediaFile.name} (Audio Attached)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Track Title *</label>
                            <Input placeholder="Enter title" value={trackTitle} onChange={e => setTrackTitle(e.target.value)} className="h-8" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Genre *</label>
                            <Input placeholder="e.g. Pop, Jazz" value={trackGenre} onChange={e => setTrackGenre(e.target.value)} className="h-8" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Button variant="ghost" size="sm" type="button"><ImageIcon className="h-4 w-4" /></Button>
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => { if (e.target.files?.[0]) { setMediaFile(e.target.files[0]); setMediaType('image') } }} />
                    </div>
                    <div className="relative">
                      <Button variant="ghost" size="sm" type="button"><Music className="h-4 w-4" /></Button>
                      <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => { if (e.target.files?.[0]) { setMediaFile(e.target.files[0]); setMediaType('audio') } }} />
                    </div>
                  </div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handlePost} disabled={isPosting || (!postContent.trim() && !mediaFile)}>
                    {isPosting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting...</> : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Feed Items */}
          {loading && feedItems.length === 0 ? (
            <div className="min-h-[30vh] flex justify-center items-center">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold text-lg mb-1">Your feed is empty</p>
              <p className="text-sm">Follow some artists or listeners to see their posts here.</p>
              <Link href="/dashboard/suggestions">
                <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/85">
                  <UserPlus className="h-4 w-4 mr-2" /> Find people to follow
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {feedItems.map(item => (
                <Card key={item.id} className="border-border hover:border-primary/50 transition">
                  {/* Post Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start gap-3">
                      {/* Avatar — gradient for dummy, image/initial for real */}
                      {item.isDummy ? (
                        <Link href={`/dashboard/profile/${item.author.username}`}>
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.author.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:opacity-80 transition`}>
                            {item.author.initials}
                          </div>
                        </Link>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.author.avatar
                            ? <img src={item.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                            : <span className="text-xs font-bold">{item.author.name.charAt(0)}</span>}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/dashboard/profile/${item.author.username}`} className="font-semibold hover:underline">
                            {item.author.name}
                          </Link>
                          <span className="text-muted-foreground text-sm">@{item.author.username}</span>
                          {item.author.userType === 'artist' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              <Music className="h-3 w-3" /> Artist
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    {item.type === 'post' && (
                      <>
                        {item.content && <p className="text-foreground mb-4 whitespace-pre-wrap">{item.content}</p>}
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
                              disabled={item.isDummy}
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

                    {item.type === 'show' && (
                      <div className="rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                        {/* Show banner */}
                        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-3 flex items-center gap-2 border-b border-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Show Announcement</span>
                          {item.isUpcoming && (
                            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Upcoming</span>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <h3 className="font-bold text-lg">{item.showTitle}</h3>
                          {item.showDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.showDescription}</p>
                          )}
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span>{item.showDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="truncate">{item.showLocation}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="min-w-[120px]">
                              <span className="text-xs text-muted-foreground">Tickets from</span>
                              <p className="font-bold text-primary">${item.showPriceUSD} <span className="text-muted-foreground font-normal text-xs">/ ৳{item.showPriceBDT}</span></p>
                            </div>
                            <Link href="/dashboard/shows" className="flex-shrink-0">
                              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85">
                                <Ticket className="h-3.5 w-3.5 mr-1.5" /> View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Engagement Stats + Buttons — skip for show cards */}
                  {item.type !== 'show' && (
                    <>
                      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex gap-4">
                        <span>{Number(item.likes).toLocaleString()} likes</span>
                        <span>{item.comments} comments</span>
                        <span>{item.shares} shares</span>
                      </div>

                  {/* Engagement Buttons */}
                  <div className="p-4 border-t border-border flex gap-4">
                    <button onClick={() => handleLike(item.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${item.isLiked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}>
                      <Heart className="h-5 w-5" fill={item.isLiked ? 'currentColor' : 'none'} />
                      <span className="text-sm">Like</span>
                    </button>
                    <button onClick={() => toggleComments(item.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${commentState[item.id]?.open ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}>
                      <MessageCircle className="h-5 w-5" fill={commentState[item.id]?.open ? 'currentColor' : 'none'} />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button onClick={() => handleShare(item.id, item.author.username)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${sharedId === item.id ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:bg-muted'}`}>
                      {sharedId === item.id ? <><Link2 className="h-5 w-5" /><span className="text-sm">Copied!</span></>
                        : <><Share2 className="h-5 w-5" /><span className="text-sm">Share</span></>}
                    </button>
                  </div>

                  {/* Inline Comment Panel */}
                  {commentState[item.id]?.open && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                      {/* Comment input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment…"
                          value={commentState[item.id]?.text ?? ''}
                          onChange={e => setCommentState(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], text: e.target.value }
                          }))}
                          onKeyDown={e => { if (e.key === 'Enter') submitComment(item.id) }}
                          className="h-9 text-sm"
                        />
                        <button
                          onClick={() => submitComment(item.id)}
                          disabled={!commentState[item.id]?.text?.trim()}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/85 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm font-medium flex-shrink-0">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Comment list */}
                      {(commentState[item.id]?.list ?? []).length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(commentState[item.id]?.list ?? []).map((c, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
                                {(c as any).avatar ? (
                                  <img src={(c as any).avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  c.author.charAt(0)
                                )}
                              </div>
                              <div className="flex-1 bg-muted rounded-lg px-3 py-1.5">
                                <span className="font-semibold text-xs text-foreground">{c.author} </span>
                                <span className="text-foreground/80">{c.text}</span>
                                <p className="text-xs text-muted-foreground mt-0.5">{c.ts}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  </>
                  )}
                </Card>

              ))}
            </div>
          )}
        </main>

        {/* ── People to Follow Sidebar ───────────────────────── */}
        <aside className="w-80 flex-shrink-0 hidden lg:block">
          <Card className="border-border sticky top-6">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-base">People to Follow</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Discover artists & listeners</p>
            </div>

            <div className="divide-y divide-border">
              {DUMMY_SUGGESTIONS.map(person => (
                <div key={person.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition">
                  <Link href={`/dashboard/profile/${person.username}`}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${person.avatar_color} flex items-center justify-center flex-shrink-0 shadow-md hover:opacity-80 transition`}>
                      <span className="text-white text-xs font-bold">{person.initials}</span>
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/dashboard/profile/${person.username}`} className="font-semibold text-sm truncate hover:underline">
                        {person.full_name}
                      </Link>
                      {person.role === 'artist' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary flex-shrink-0">
                          <Music className="h-2.5 w-2.5" /> Artist
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground flex-shrink-0">
                          <Headphones className="h-2.5 w-2.5" /> Listener
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{person.genre}</p>
                    <p className="text-[11px] text-muted-foreground">{person.followers} followers</p>
                  </div>

                  <button
                    onClick={() => handleSidebarFollow(person.id, person.username)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      sidebarFollowed[person.id]
                        ? 'bg-muted text-muted-foreground border border-border'
                        : 'bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm shadow-primary/30'
                    }`}
                  >
                    {sidebarFollowed[person.id]
                      ? <><Check className="h-3 w-3" /> Following</>
                      : <><UserPlus className="h-3 w-3" /> Follow</>}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <Link href="/dashboard/suggestions"
                className="w-full block text-center text-xs text-primary hover:underline font-medium py-0.5">
                Show more suggestions →
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
