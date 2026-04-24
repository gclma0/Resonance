'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PresenceContextType {
  onlineUserIds: Set<string>
}

const PresenceContext = createContext<PresenceContextType>({ onlineUserIds: new Set() })

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    let channel: any = null

    async function initPresence() {
      const { data: { user } } = await supabase.auth.getUser()
      
      channel = supabase.channel('online-users', {
        config: {
          presence: { key: user ? user.id : 'anonymous' },
        },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const currentOnline = new Set<string>()
          for (const id in state) {
            currentOnline.add(id)
          }
          setOnlineUserIds(currentOnline)
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && user) {
            await channel.track({ online_at: new Date().toISOString(), user_id: user.id })
          }
        })
    }

    initPresence()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  return useContext(PresenceContext)
}
