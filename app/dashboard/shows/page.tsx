'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, MapPin, Users, Ticket, X, Music } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getStoredShows, type StoredShow } from '@/lib/shows-store'

interface Show {
  id: string
  title: string
  artist: { name: string; username: string }
  collaborators?: string[]
  date: string
  dateTs: number
  location: string
  ticketPrice: { usd: number; bdt: number }
  totalTickets: number
  ticketsSold: number
  description: string
  gradient: string
}

const SHOWS: Show[] = [
  {
    id: '1', title: 'Neon Nights Concert',
    artist: { name: 'Alex Johnson', username: 'alexjohns' },
    date: 'Aug 15, 2026', dateTs: new Date('2026-08-15').getTime(),
    location: 'Dhaka Concert Hall, Bangladesh',
    ticketPrice: { usd: 25, bdt: 2700 }, totalTickets: 500, ticketsSold: 342,
    description: 'An electrifying evening of electronic and synth-pop music with world-class production.',
    gradient: 'from-teal-700/40 to-teal-500/40',
  },
  {
    id: '2', title: 'Summer Festival Collab',
    artist: { name: 'Luna Waves', username: 'lunawaves' },
    collaborators: ['DJ Studio', 'Echo Sound'],
    date: 'Sep 22, 2026', dateTs: new Date('2026-09-22').getTime(),
    location: 'Chittagong Open Ground, Bangladesh',
    ticketPrice: { usd: 30, bdt: 3240 }, totalTickets: 1000, ticketsSold: 567,
    description: 'A massive collaboration bringing together top artists for an unforgettable night under the stars.',
    gradient: 'from-slate-800/40 to-teal-900/40',
  },
  {
    id: '3', title: 'Acoustic Sessions',
    artist: { name: 'Jazz Vibes', username: 'jazzvibes' },
    date: 'Jul 28, 2026', dateTs: new Date('2026-07-28').getTime(),
    location: 'Sylhet Cultural Center, Bangladesh',
    ticketPrice: { usd: 15, bdt: 1620 }, totalTickets: 200, ticketsSold: 156,
    description: 'Intimate acoustic performances in a cozy setting — an evening of pure, raw jazz.',
    gradient: 'from-stone-800/40 to-black/40',
  },
  {
    id: '4', title: 'Chrome City Live',
    artist: { name: 'Neon Pulse', username: 'neonpulse' },
    date: 'Nov 5, 2026', dateTs: new Date('2026-11-05').getTime(),
    location: 'Bashundhara Convention City, Dhaka',
    ticketPrice: { usd: 40, bdt: 4320 }, totalTickets: 800, ticketsSold: 721,
    description: 'The legendary Synthwave act brings Chrome City to life in an immersive live show.',
    gradient: 'from-cyan-700/40 to-teal-600/40',
  },
  {
    id: '5', title: 'Warehouse Protocol',
    artist: { name: 'DJ Karsten', username: 'djkarsten' },
    date: 'Mar 8, 2026', dateTs: new Date('2026-03-08').getTime(),
    location: 'Club Dhaka Underground',
    ticketPrice: { usd: 20, bdt: 2160 }, totalTickets: 300, ticketsSold: 300,
    description: 'A sold-out underground techno night that went down in history.',
    gradient: 'from-teal-900/40 to-black/40',
  },
  {
    id: '6', title: 'Velvet Abyss Tour — Dhaka',
    artist: { name: 'Celeste Noir', username: 'celestenoir' },
    date: 'Oct 12, 2026', dateTs: new Date('2026-10-12').getTime(),
    location: 'International Convention City Bashundhara',
    ticketPrice: { usd: 35, bdt: 3780 }, totalTickets: 600, ticketsSold: 180,
    description: 'Celeste Noir\'s World Tour makes its Bangladesh debut with a dark pop spectacular.',
    gradient: 'from-zinc-800/40 to-teal-900/40',
  },
]

const GRADIENTS = [
  'from-teal-800/40 to-zinc-900/40',
  'from-zinc-800/40 to-black/40',
  'from-slate-800/40 to-teal-900/40',
  'from-stone-800/40 to-black/40',
  'from-teal-900/40 to-black/40',
  'from-black/40 to-teal-900/40',
]

export default function ShowsPage() {
  const router = useRouter()
  const now = Date.now()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newShow, setNewShow] = useState({ title: '', date: '', location: '', priceUSD: '', description: '' })
  const [ticketQty, setTicketQty] = useState<Record<string, number>>({})
  const [allShows, setAllShows] = useState(SHOWS)

  // Merge user-created shows from localStorage on mount
  useEffect(() => {
    const stored = getStoredShows()
    if (!stored.length) return
    const converted = stored.map((s: StoredShow, i: number) => ({
      id: s.id,
      title: s.title,
      artist: { name: s.artistName, username: s.artistUsername },
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateTs: new Date(s.date).getTime(),
      location: s.location,
      ticketPrice: s.ticketPrice,
      totalTickets: s.totalTickets,
      ticketsSold: s.ticketsSold,
      description: s.description,
      gradient: GRADIENTS[i % GRADIENTS.length],
    }))
    // Merge: user shows first, then static shows that don't share an id
    const staticIds = new Set(converted.map((s: any) => s.id))
    setAllShows([...converted, ...SHOWS.filter(s => !staticIds.has(s.id))])
  }, [])

  const filtered = allShows.filter(s => {
    if (filter === 'upcoming') return s.dateTs >= now
    if (filter === 'past') return s.dateTs < now
    return true
  })

  const handleBuy = (show: Show) => {
    const qty = ticketQty[show.id] || 1
    const cartItem = [{
      id: show.id, type: 'show', title: `${show.title} — ${qty} Ticket${qty > 1 ? 's' : ''}`,
      quantity: qty, priceUSD: show.ticketPrice.usd, priceBDT: show.ticketPrice.bdt,
    }]
    sessionStorage.setItem('checkout_cart', JSON.stringify(cartItem))
    router.push('/dashboard/checkout')
  }

  const soldOut = (s: Show) => s.ticketsSold >= s.totalTickets

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Live Shows &amp; Concerts</h1>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/85" onClick={() => setShowCreateModal(true)}>
          + Create Show
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-8">
        {(['all', 'upcoming', 'past'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)} className={filter === f ? 'bg-primary' : ''}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(show => {
          const pct = (show.ticketsSold / show.totalTickets) * 100
          const isSoldOut = soldOut(show)
          const isPast = show.dateTs < now
          const qty = ticketQty[show.id] || 1
          return (
            <Card key={show.id} className="border-border overflow-hidden hover:border-primary/50 transition group">
              {/* Banner */}
              <div className={`w-full h-40 bg-gradient-to-br ${show.gradient} flex items-center justify-center relative`}>
                <Music className="h-12 w-12 text-white/30" />
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg tracking-widest">SOLD OUT</span>
                  </div>
                )}
                {!isSoldOut && pct > 80 && !isPast && (
                  <div className="absolute top-2 right-2 bg-destructive text-white px-2 py-1 rounded text-xs font-semibold">
                    Almost Sold Out
                  </div>
                )}
                {isPast && !isSoldOut && (
                  <div className="absolute top-2 right-2 bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-semibold">
                    Past Show
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition">{show.title}</h3>
                <p className="text-sm font-medium mb-1">
                  by{' '}
                  <Link href={`/dashboard/profile/${show.artist.username}`} className="text-primary hover:underline">
                    {show.artist.name}
                  </Link>
                </p>
                {show.collaborators && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Users className="h-3 w-3" />
                    <span>with {show.collaborators.join(', ')}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{show.description}</p>

                <div className="space-y-1.5 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" /><span>{show.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" /><span className="truncate">{show.location}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{show.ticketsSold}/{show.totalTickets} sold</span>
                    <span className="font-medium">{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                {/* Price + Buy */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Per ticket</p>
                    <p className="font-bold text-primary">${show.ticketPrice.usd} / ৳{show.ticketPrice.bdt}</p>
                  </div>
                  {!isPast && !isSoldOut ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={qty}
                        onChange={e => setTicketQty(prev => ({ ...prev, [show.id]: parseInt(e.target.value) }))}
                        className="text-xs border border-border rounded px-1.5 py-1 bg-background"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}x</option>)}
                      </select>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85"
                        onClick={() => handleBuy(show)}>
                        <Ticket className="h-3.5 w-3.5 mr-1" /> Buy
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" disabled>{isSoldOut ? 'Sold Out' : 'Ended'}</Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No {filter} shows</h3>
          <p className="text-muted-foreground">Check back soon for more events.</p>
        </div>
      )}

      {/* Create Show Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-background border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Create a Show</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Show Title</label>
                <Input className="mt-1" placeholder="e.g. Neon Nights Vol. 2" value={newShow.title}
                  onChange={e => setNewShow(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input className="mt-1" type="date" value={newShow.date}
                    onChange={e => setNewShow(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Ticket Price (USD)</label>
                  <Input className="mt-1" type="number" placeholder="25" value={newShow.priceUSD}
                    onChange={e => setNewShow(p => ({ ...p, priceUSD: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Venue / Location</label>
                <Input className="mt-1" placeholder="e.g. Dhaka Concert Hall" value={newShow.location}
                  onChange={e => setNewShow(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Tell fans what to expect…" value={newShow.description}
                  onChange={e => setNewShow(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/85"
                disabled={!newShow.title || !newShow.date || !newShow.location}
                onClick={() => { alert('Show submitted! (Would be saved to DB in production.)'); setShowCreateModal(false) }}>
                Publish Show
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
