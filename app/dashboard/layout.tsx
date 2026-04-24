'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResonanceLogo } from '@/components/resonance-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell, MessageSquare, LogOut, User, Home, Rss, Users, Ticket, ShoppingBag, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from '@/components/search-bar'
import { PresenceProvider } from '@/components/presence-provider'

function UserProfileDropdown({ currentUser }: { currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

function TopNavActions({ currentUser }: { currentUser: any }) {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [latestMessages, setLatestMessages] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  
  const [isBellOpen, setIsBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  
  const [isMessageTrayOpen, setIsMessageTrayOpen] = useState(false)
  const messageTrayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()

    async function fetchData() {
      // Unread messages
      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false)
      setUnreadMessages(count || 0)

      // My followings
      const { data: myFollows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id)
      const followingIds = myFollows?.map(f => f.following_id) || []

      // Notifications: new follows to me
      const { data: newFollows } = await supabase.from('follows').select('*, follower:follower_id(*)').eq('following_id', currentUser.id).order('created_at', { ascending: false }).limit(10)
      
      // Notifications: new shows from people I follow
      let newShows: any[] = []
      if (followingIds.length > 0) {
        const { data: shows } = await supabase.from('shows').select('*, artist:artist_id(*)').in('artist_id', followingIds).order('created_at', { ascending: false }).limit(10)
        newShows = shows || []
      }

      // My Content IDs
      const [{ data: myPosts }, { data: myTracks }, { data: myShowsRes }] = await Promise.all([
        supabase.from('posts').select('id, content, image_url').eq('user_id', currentUser.id),
        supabase.from('music_tracks').select('id, title').eq('artist_id', currentUser.id),
        supabase.from('shows').select('id, title').eq('artist_id', currentUser.id)
      ])

      const myPostIds = myPosts?.map(p => p.id) || []
      const myTrackIds = myTracks?.map(t => t.id) || []
      const myShowIds = myShowsRes?.map(s => s.id) || []

      // Parallel DB queries for Likes & Comments (more reliable than string parsing)
      const [postLikesRes, trackLikesRes, postCommentsRes, trackCommentsRes] = await Promise.all([
        myPostIds.length > 0 ? supabase.from('likes').select('*, user:user_id(*)').neq('user_id', currentUser.id).in('post_id', myPostIds).limit(15) : { data: [] },
        myTrackIds.length > 0 ? supabase.from('likes').select('*, user:user_id(*)').neq('user_id', currentUser.id).in('track_id', myTrackIds).limit(15) : { data: [] },
        myPostIds.length > 0 ? supabase.from('comments').select('*, user:user_id(*)').neq('user_id', currentUser.id).in('post_id', myPostIds).limit(15) : { data: [] },
        myTrackIds.length > 0 ? supabase.from('comments').select('*, user:user_id(*)').neq('user_id', currentUser.id).in('track_id', myTrackIds).limit(15) : { data: [] }
      ])

      const newLikes = [...(postLikesRes.data || []), ...(trackLikesRes.data || [])]
      const newComments = [...(postCommentsRes.data || []), ...(trackCommentsRes.data || [])]

      // Mentions
      const { data: mentionComments } = await supabase.from('comments')
        .select('*, user:user_id(*)')
        .like('content', `%@${currentUser.username}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      // Latest shares
      const { data: sharePosts } = await supabase.from('posts')
         .select('*, user:user_id(*)')
         .neq('user_id', currentUser.id)
         .like('content', '%[SHARE:%')
         .order('created_at', { ascending: false })
         .limit(50)

      let newShares: any[] = []
      if (sharePosts) {
         newShares = sharePosts.filter((p: any) => {
            const match = p.content.match(/\[SHARE:(post|music|show):([^\]]+)\]/)
            if (!match) return false
            const type = match[1]
            const id = match[2]
            if (type === 'post' && myPostIds.includes(id)) return true
            if (type === 'music' && myTrackIds.includes(id)) return true
            if (type === 'show' && myShowIds.includes(id)) return true
            return false
         })
      }

      // Latest Messages for Tray
      const { data: latestMsgs } = await supabase.from('messages')
        .select('*, sender:sender_id(*)')
        .eq('receiver_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const uniqueMsgs: any[] = []
      const seenSenders = new Set()
      if (latestMsgs) {
         for (const msg of latestMsgs) {
           if (!seenSenders.has(msg.sender_id)) {
             seenSenders.add(msg.sender_id)
             uniqueMsgs.push(msg)
           }
         }
      }
      setLatestMessages(uniqueMsgs.slice(0, 5))

      const combined = [
        ...(newFollows || []).map(f => ({ type: 'follow', data: f, date: new Date(f.created_at).getTime() })),
        ...newShows.map(s => ({ type: 'show', data: s, date: new Date(s.created_at).getTime() })),
        ...newLikes.map(l => ({ type: 'like', data: l, date: new Date(l.created_at).getTime() })),
        ...newComments.map(c => ({ type: 'comment', data: c, date: new Date(c.created_at).getTime() })),
        ...(mentionComments || []).map(m => ({ type: 'mention', data: m, date: new Date(m.created_at).getTime() })),
        ...newShares.map(s => ({ type: 'share', data: s, date: new Date(s.created_at).getTime() }))
      ].sort((a, b) => b.date - a.date).slice(0, 15)

      setNotifications(combined)

      const lastViewed = parseInt(localStorage.getItem('last_viewed_notifications') || '0')
      const unreadCount = combined.filter(n => n.date > lastViewed).length
      setUnreadNotifications(unreadCount)
    }

    fetchData()

    // Realtime subscriptions
    const channel = supabase.channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, () => {
        if (pathname !== '/dashboard/messages') {
          setUnreadMessages(prev => prev + 1)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows', filter: `following_id=eq.${currentUser.id}` }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shows' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser, pathname])

  // Polling fallback every 30s in case realtime is not enabled in Supabase
  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    const poll = setInterval(async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false)
      setUnreadMessages(count || 0)
    }, 30000)
    return () => clearInterval(poll)
  }, [currentUser])

  useEffect(() => {
    if (pathname === '/dashboard/messages') {
      setUnreadMessages(0)
      const supabase = createClient()
      if (currentUser) {
        supabase.from('messages').update({ is_read: true }).eq('receiver_id', currentUser.id).eq('is_read', false).then()
      }
    }
  }, [pathname, currentUser])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setIsBellOpen(false)
      if (messageTrayRef.current && !messageTrayRef.current.contains(event.target as Node)) setIsMessageTrayOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenBell = () => {
    setIsBellOpen(!isBellOpen)
    setIsMessageTrayOpen(false)
    if (!isBellOpen) {
      setUnreadNotifications(0)
      localStorage.setItem('last_viewed_notifications', Date.now().toString())
    }
  }

  const handleOpenMessageTray = () => {
    setIsMessageTrayOpen(!isMessageTrayOpen)
    setIsBellOpen(false)
    if (!isMessageTrayOpen && currentUser) {
      setUnreadMessages(0)
      const supabase = createClient()
      supabase.from('messages').update({ is_read: true }).eq('receiver_id', currentUser.id).eq('is_read', false).then()
    }
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <div className="relative" ref={bellRef}>
        <Button variant="ghost" size="icon" onClick={handleOpenBell} className="text-muted-foreground hover:text-foreground hover:bg-accent relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
          )}
        </Button>
        {isBellOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-background border border-border py-2 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b border-border font-bold">Notifications</div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No new notifications</div>
              ) : (
                notifications.map((n, i) => (
                  <Link key={i} href={
                    n.type === 'follow' ? `/dashboard/profile/${n.data.follower.username}` :
                    n.type === 'show' ? `/dashboard/shows` :
                    `/dashboard/feed`
                  } className="block px-4 py-3 hover:bg-muted transition border-b border-border/50 last:border-0" onClick={() => setIsBellOpen(false)}>
                    {n.type === 'follow' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.follower.full_name}</span> started following you.</div>
                    )}
                    {n.type === 'show' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.artist.full_name}</span> posted a new show: {n.data.title}</div>
                    )}
                    {n.type === 'like' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.user.full_name}</span> liked your {n.data.track_id ? 'track' : 'post'}.</div>
                    )}
                    {n.type === 'comment' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.user.full_name}</span> commented on your {n.data.track_id ? 'track' : 'post'}.</div>
                    )}
                    {n.type === 'mention' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.user.full_name}</span> mentioned you in a comment.</div>
                    )}
                    {n.type === 'share' && (
                      <div className="text-sm"><span className="font-semibold text-foreground">{n.data.user.full_name}</span> shared your content.</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(n.date).toLocaleDateString()} at {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="relative" ref={messageTrayRef}>
        <Button variant="ghost" size="icon" onClick={handleOpenMessageTray} className="text-muted-foreground hover:text-foreground hover:bg-accent relative">
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Button>
        {isMessageTrayOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-background border border-border py-2 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b border-border font-bold flex justify-between items-center">
              Messages
              <Link href="/dashboard/messages" onClick={() => setIsMessageTrayOpen(false)} className="text-xs text-primary hover:underline font-normal">View all</Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {latestMessages.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No recent messages</div>
              ) : (
                latestMessages.map((msg, i) => (
                  <Link key={i} href={`/dashboard/messages?user=${msg.sender.username}`} className="block px-4 py-3 hover:bg-muted transition border-b border-border/50 last:border-0" onClick={() => setIsMessageTrayOpen(false)}>
                    <div className="flex gap-3 items-center">
                       <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                         {msg.sender.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" /> : <span className="font-bold text-xs">{msg.sender.full_name.charAt(0)}</span>}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-semibold text-foreground truncate">{msg.sender.full_name}</div>
                         <div className={`text-xs truncate ${!msg.is_read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{msg.content}</div>
                       </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)

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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <PresenceProvider>
      <div className="min-h-screen bg-background">
      <nav className="bg-background/90 border-b border-border/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ResonanceLogo size={34} />
              </Link>
              
              <div className="hidden md:block w-full max-w-md ml-4">
                <SearchBar />
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <TopNavActions currentUser={currentUser} />
              
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <UserProfileDropdown currentUser={currentUser} />
              <Button variant="ghost" size="sm" onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 md:px-3">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
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
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border/50 z-50 flex items-center justify-around px-2 pb-safe">
        {[
          { href: '/dashboard/feed',         icon: Rss,         label: 'Feed' },
          { href: '/dashboard/suggestions',  icon: Search,      label: 'Search' },
          { href: '/dashboard/artists',      icon: Users,       label: 'Artists' },
          { href: '/dashboard/shows',        icon: Ticket,      label: 'Shows' },
          { href: '/dashboard/marketplace',  icon: ShoppingBag, label: 'Market' },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors">
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
    </PresenceProvider>
  )
}
