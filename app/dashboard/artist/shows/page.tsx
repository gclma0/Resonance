'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { saveShow, deleteShow, getStoredShows, type StoredShow } from '@/lib/shows-store'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar, MapPin, Users, DollarSign, Plus, Edit, Trash2,
  X, TrendingUp, Ticket, RefreshCw, Check
} from 'lucide-react'

// Live-ish exchange rate (BDT per 1 USD). Could be fetched from an API in production.
const USD_TO_BDT = 110

interface Show {
  id: string
  title: string
  date: string          // ISO datetime string
  location: string
  description: string
  ticketPrice: { usd: number; bdt: number }
  totalTickets: number
  ticketsSold: number
}

const EMPTY_FORM = {
  title: '', date: '', location: '', description: '',
  ticketPriceUSD: '', ticketPriceBDT: '', totalTickets: '',
}

type FormState = typeof EMPTY_FORM

// Returns today's datetime-local min string  e.g. "2026-04-22T01:20"
function todayMin() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ArtistShowsPage() {
  const [shows, setShows] = useState<Show[]>([])
  const [currentUser, setCurrentUser] = useState<{ full_name: string; username: string } | null>(null)

  const [mode, setMode] = useState<'none' | 'create' | 'edit'>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [minDate] = useState(todayMin())

  // Load from localStorage + Supabase user on mount
  useEffect(() => {
    const stored = getStoredShows()
    if (stored.length) {
      setShows(stored.map(s => ({
        id: s.id, title: s.title, date: s.date, location: s.location,
        description: s.description, ticketPrice: s.ticketPrice,
        totalTickets: s.totalTickets, ticketsSold: s.ticketsSold,
      })))
    } else {
      // Seed with one demo show
      const demo: Show = {
        id: 'demo-1', title: 'Neon Nights Concert', date: '2026-08-15T20:00',
        location: 'Dhaka Concert Hall, Bangladesh',
        description: 'An electrifying evening of electronic and synth-pop music.',
        ticketPrice: { usd: 25, bdt: Math.round(25 * USD_TO_BDT) },
        totalTickets: 500, ticketsSold: 342,
      }
      setShows([demo])
    }
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        createClient().from('users').select('full_name,username').eq('id', user.id).single()
          .then(({ data }) => { if (data) setCurrentUser(data) })
      }
    })
  }, [])

  // Auto-convert USD → BDT when USD price changes
  const handleUSDChange = (val: string) => {
    const usd = parseFloat(val)
    const bdt = isNaN(usd) ? '' : String(Math.round(usd * USD_TO_BDT))
    setForm(f => ({ ...f, ticketPriceUSD: val, ticketPriceBDT: bdt }))
    setErrors(e => ({ ...e, ticketPriceUSD: '' }))
  }

  // Auto-convert BDT → USD when BDT price changes
  const handleBDTChange = (val: string) => {
    const bdt = parseFloat(val)
    const usd = isNaN(bdt) ? '' : String(Math.round((bdt / USD_TO_BDT) * 100) / 100)
    setForm(f => ({ ...f, ticketPriceBDT: val, ticketPriceUSD: usd }))
    setErrors(e => ({ ...e, ticketPriceBDT: '' }))
  }

  const validate = (): boolean => {
    const errs: Partial<FormState> = {}
    if (!form.title.trim()) errs.title = 'Required'
    if (!form.date) {
      errs.date = 'Required'
    } else if (new Date(form.date) < new Date()) {
      errs.date = 'Date must be in the present or future'
    }
    if (!form.location.trim()) errs.location = 'Required'
    if (!form.ticketPriceUSD || parseFloat(form.ticketPriceUSD) <= 0)
      errs.ticketPriceUSD = 'Enter a valid price'
    if (!form.totalTickets || parseInt(form.totalTickets) <= 0)
      errs.totalTickets = 'Enter total ticket count'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditId(null)
    setMode('create')
  }

  const openEdit = (show: Show) => {
    setForm({
      title: show.title,
      date: show.date,
      location: show.location,
      description: show.description,
      ticketPriceUSD: String(show.ticketPrice.usd),
      ticketPriceBDT: String(show.ticketPrice.bdt),
      totalTickets: String(show.totalTickets),
    })
    setErrors({})
    setEditId(show.id)
    setMode('edit')
  }

  const handleSubmit = () => {
    if (!validate()) return
    const payload: Show = {
      id: editId ?? `show_${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      location: form.location.trim(),
      description: form.description.trim(),
      ticketPrice: {
        usd: parseFloat(form.ticketPriceUSD),
        bdt: parseFloat(form.ticketPriceBDT) || Math.round(parseFloat(form.ticketPriceUSD) * USD_TO_BDT),
      },
      totalTickets: parseInt(form.totalTickets),
      ticketsSold: editId ? (shows.find(s => s.id === editId)?.ticketsSold ?? 0) : 0,
    }
    // Persist to localStorage store so Shows page + Feed pick it up
    saveShow({
      ...payload,
      artistName: currentUser?.full_name ?? 'You',
      artistUsername: currentUser?.username ?? 'me',
      createdAt: Date.now(),
    })
    if (mode === 'create') setShows(prev => [payload, ...prev])
    else setShows(prev => prev.map(s => s.id === editId ? payload : s))
    setMode('none')
    setEditId(null)
  }

  const handleDelete = (id: string) => {
    deleteShow(id)
    setShows(prev => prev.filter(s => s.id !== id))
    setDeleteConfirm(null)
  }

  const pct = (s: Show) => Math.min(Math.round((s.ticketsSold / s.totalTickets) * 100), 100)
  const revenueUSD = (s: Show) => (s.ticketsSold * s.ticketPrice.usd).toFixed(2)
  const revenueBDT = (s: Show) => (s.ticketsSold * s.ticketPrice.bdt).toLocaleString()

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Shows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exchange rate: 1 USD = {USD_TO_BDT} BDT
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/85">
          <Plus className="h-4 w-4 mr-2" /> Create Show
        </Button>
      </div>

      {/* Create / Edit Form Modal */}
      {mode !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-xl p-6 bg-background border-border my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{mode === 'create' ? 'Create New Show' : 'Edit Show'}</h2>
              <button onClick={() => setMode('none')} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium">Show Title *</label>
                <Input className="mt-1" placeholder="e.g. Summer Festival 2026"
                  value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(err => ({ ...err, title: '' })) }} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-sm font-medium">Date &amp; Time * <span className="text-muted-foreground font-normal">(must be present or future)</span></label>
                <Input className="mt-1" type="datetime-local" min={minDate}
                  value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(err => ({ ...err, date: '' })) }} />
                {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium">Venue / Location *</label>
                <Input className="mt-1" placeholder="e.g. Dhaka Concert Hall, Bangladesh"
                  value={form.location} onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setErrors(err => ({ ...err, location: '' })) }} />
                {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
              </div>

              {/* Ticket Prices with live conversion */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Ticket Price *</label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Auto-converts at 1 USD = {USD_TO_BDT} BDT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">USD ($)</label>
                    <Input className="mt-1" type="number" min="0" step="0.01" placeholder="25.00"
                      value={form.ticketPriceUSD} onChange={e => handleUSDChange(e.target.value)} />
                    {errors.ticketPriceUSD && <p className="text-xs text-destructive mt-1">{errors.ticketPriceUSD}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">BDT (৳)</label>
                    <Input className="mt-1" type="number" min="0" placeholder="2750"
                      value={form.ticketPriceBDT} onChange={e => handleBDTChange(e.target.value)} />
                  </div>
                </div>
                {form.ticketPriceUSD && form.ticketPriceBDT && (
                  <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    ${parseFloat(form.ticketPriceUSD).toFixed(2)} = ৳{parseFloat(form.ticketPriceBDT).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Total Tickets */}
              <div>
                <label className="text-sm font-medium">Total Tickets *</label>
                <Input className="mt-1" type="number" min="1" placeholder="500"
                  value={form.totalTickets} onChange={e => { setForm(f => ({ ...f, totalTickets: e.target.value })); setErrors(err => ({ ...err, totalTickets: '' })) }} />
                {errors.totalTickets && <p className="text-xs text-destructive mt-1">{errors.totalTickets}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                  placeholder="Tell fans what to expect…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setMode('none')}>Cancel</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
                {mode === 'create' ? 'Publish Show' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Shows List */}
      <div className="space-y-4">
        {shows.length === 0 ? (
          <Card className="p-12 text-center border-border">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shows Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first show to start selling tickets.</p>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Create Show
            </Button>
          </Card>
        ) : (
          shows.map(show => {
            const isPast = new Date(show.date) < new Date()
            return (
              <Card key={show.id} className="p-6 border-border hover:border-primary/30 transition">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left — Info */}
                  <div>
                    <div className="flex items-start gap-2 mb-3">
                      <h3 className="text-xl font-bold flex-1">{show.title}</h3>
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">Past</span>
                      )}
                    </div>
                    {show.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{show.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{formatDate(show.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{show.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">${show.ticketPrice.usd}</span>
                        <span className="text-muted-foreground">/ ৳{show.ticketPrice.bdt.toLocaleString()} per ticket</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — Stats & Actions */}
                  <div className="space-y-4">
                    {/* Ticket Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium">{show.ticketsSold} / {show.totalTickets} sold</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{pct(show)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${pct(show)}%` }} />
                      </div>
                    </div>

                    {/* Revenue — dual currency */}
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                      </div>
                      <p className="text-xl font-bold text-primary">${revenueUSD(show)}</p>
                      <p className="text-sm text-muted-foreground">৳{revenueBDT(show)} BDT</p>
                    </div>

                    {/* Remaining tickets */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="h-4 w-4" />
                      <span>{show.totalTickets - show.ticketsSold} tickets remaining</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(show)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      {deleteConfirm === show.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(show.id)}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(show.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </main>
  )
}
