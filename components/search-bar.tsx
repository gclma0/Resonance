'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)
      const supabase = createClient()
      
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, role')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5)

      setResults(data || [])
      setIsLoading(false)
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (username: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/dashboard/profile/${username}`)
  }

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true) }}
          className="w-full bg-muted/50 border border-border/50 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user.username)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-secondary-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate">{user.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate">@{user.username} • {user.role}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
