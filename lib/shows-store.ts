// Shared localStorage store for user-created shows
// Used by: Manage Shows page (write), Shows page (read), Feed page (read)

export interface StoredShow {
  id: string
  title: string
  date: string          // ISO datetime, e.g. "2026-08-15T20:00"
  location: string
  description: string
  ticketPrice: { usd: number; bdt: number }
  totalTickets: number
  ticketsSold: number
  artistName: string    // display name of the creating artist
  artistUsername: string
  createdAt: number     // Date.now() timestamp
}

const KEY = 'resonance_shows'

export function getStoredShows(): StoredShow[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveShow(show: StoredShow): void {
  const existing = getStoredShows()
  const idx = existing.findIndex(s => s.id === show.id)
  if (idx >= 0) existing[idx] = show
  else existing.unshift(show)
  localStorage.setItem(KEY, JSON.stringify(existing))
}

export function deleteShow(id: string): void {
  const filtered = getStoredShows().filter(s => s.id !== id)
  localStorage.setItem(KEY, JSON.stringify(filtered))
}
