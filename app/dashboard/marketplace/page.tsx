'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShoppingCart, Heart, Star, X, Plus, Minus, Trash2 } from 'lucide-react'

interface MerchandiseItem {
  id: string
  title: string
  artist: { name: string; username: string }
  price: { usd: number; bdt: number }
  rating: number
  reviews: number
  stock: number
  category: string
  emoji: string
}

const ITEMS: MerchandiseItem[] = [
  { id: '1', title: 'Neon Dreams T-Shirt', artist: { name: 'Alex Johnson', username: 'alexjohns' }, price: { usd: 25, bdt: 2700 }, rating: 4.8, reviews: 234, stock: 50, category: 'Apparel', emoji: '👕' },
  { id: '2', title: 'Limited Edition Vinyl', artist: { name: 'Luna Waves', username: 'lunawaves' }, price: { usd: 45, bdt: 4860 }, rating: 4.9, reviews: 156, stock: 15, category: 'Music', emoji: '💿' },
  { id: '3', title: 'Artist Collaboration Cap', artist: { name: 'DJ Studio', username: 'djstudio' }, price: { usd: 30, bdt: 3240 }, rating: 4.6, reviews: 89, stock: 75, category: 'Apparel', emoji: '🧢' },
  { id: '4', title: 'Concert Photography Book', artist: { name: 'Jazz Vibes', username: 'jazzvibes' }, price: { usd: 35, bdt: 3780 }, rating: 4.7, reviews: 123, stock: 30, category: 'Media', emoji: '📸' },
  { id: '5', title: 'Signature Headphones', artist: { name: 'Echo Sound', username: 'echosound' }, price: { usd: 120, bdt: 12960 }, rating: 4.9, reviews: 345, stock: 20, category: 'Equipment', emoji: '🎧' },
  { id: '6', title: 'Digital Album Bundle', artist: { name: 'Synth Wave', username: 'synthwave' }, price: { usd: 15, bdt: 1620 }, rating: 4.5, reviews: 67, stock: 999, category: 'Digital', emoji: '🎵' },
  { id: '7', title: 'Celeste Noir Hoodie', artist: { name: 'Celeste Noir', username: 'celestenoir' }, price: { usd: 55, bdt: 5940 }, rating: 4.8, reviews: 312, stock: 40, category: 'Apparel', emoji: '🖤' },
  { id: '8', title: 'Neon Pulse Poster Set', artist: { name: 'Neon Pulse', username: 'neonpulse' }, price: { usd: 20, bdt: 2160 }, rating: 4.7, reviews: 198, stock: 100, category: 'Media', emoji: '🖼️' },
  { id: '9', title: 'DJ Karsten Sample Pack', artist: { name: 'DJ Karsten', username: 'djkarsten' }, price: { usd: 10, bdt: 1080 }, rating: 4.9, reviews: 421, stock: 999, category: 'Digital', emoji: '🎛️' },
]

const CATEGORIES = ['all', 'Apparel', 'Music', 'Media', 'Equipment', 'Digital']

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({rating})</span>
    </div>
  )
}

export default function MarketplacePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<Record<string, number>>({}) // id → qty
  const [cartOpen, setCartOpen] = useState(false)
  const [addedId, setAddedId] = useState<string | null>(null)

  const filtered = ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.artist.name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = category === 'all' || item.category === category
    return matchesSearch && matchesCat
  })

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartItems = ITEMS.filter(i => cart[i.id] > 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price.usd * (cart[i.id] || 0), 0)

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
    setAddedId(id)
    setTimeout(() => setAddedId(null), 1500)
  }
  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const next = (prev[id] || 0) + delta
      if (next <= 0) { const { [id]: _, ...rest } = prev; return rest }
      return { ...prev, [id]: next }
    })
  }
  const removeFromCart = (id: string) => {
    setCart(prev => { const { [id]: _, ...rest } = prev; return rest })
  }

  const handleCheckout = () => {
    const checkoutCart = cartItems.map(item => ({
      id: item.id, type: 'merchandise', title: item.title,
      quantity: cart[item.id], priceUSD: item.price.usd, priceBDT: item.price.bdt,
    }))
    sessionStorage.setItem('checkout_cart', JSON.stringify(checkoutCart))
    setCartOpen(false)
    router.push('/dashboard/checkout')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-muted transition">
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" placeholder="Search merchandise or artists…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/50 focus:border-primary outline-none transition text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {CATEGORIES.map(cat => (
          <Button key={cat} variant={category === cat ? 'default' : 'outline'}
            onClick={() => setCategory(cat)} className={category === cat ? 'bg-primary whitespace-nowrap' : 'whitespace-nowrap'}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <Card key={item.id} className="border-border overflow-hidden hover:border-primary/50 transition group">
            {/* Image area */}
            <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
              <span className="text-6xl">{item.emoji}</span>
              {item.stock < 25 && item.stock > 0 && (
                <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-semibold">
                  Low Stock
                </div>
              )}
              {item.stock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold">Out of Stock</span>
                </div>
              )}
              <button onClick={() => setWishlist(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                className="absolute top-2 left-2 bg-background/80 backdrop-blur p-1.5 rounded-lg hover:bg-background transition">
                <Heart className={`h-4 w-4 ${wishlist.includes(item.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-base mb-1 group-hover:text-primary transition line-clamp-1">{item.title}</h3>
              <Link href={`/dashboard/profile/${item.artist.username}`}
                className="text-xs text-primary hover:underline mb-2 inline-block">
                by {item.artist.name}
              </Link>
              <div className="mb-2"><Stars rating={item.rating} /></div>
              <p className="text-xs text-muted-foreground mb-3">{item.reviews} reviews · {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}</p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-lg">${item.price.usd}</p>
                  <p className="text-xs text-muted-foreground">৳{item.price.bdt}</p>
                </div>
                <Button size="sm"
                  className={`transition-all ${addedId === item.id ? 'bg-green-600 text-white hover:bg-green-600' : 'bg-primary text-primary-foreground hover:bg-primary/85'}`}
                  disabled={item.stock === 0}
                  onClick={() => addToCart(item.id)}>
                  {addedId === item.id ? '✓ Added' : <><ShoppingCart className="h-3.5 w-3.5 mr-1" />Add</>}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">Try a different search or category.</p>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-background border-l border-border flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty.</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">${item.price.usd} each</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{cart[item.id]}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${(item.price.usd * (cart[item.id] || 0)).toFixed(2)}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive mt-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/85" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
