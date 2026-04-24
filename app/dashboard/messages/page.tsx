'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Search, MoreVertical, ArrowLeft } from 'lucide-react'
import { DUMMY_ACCOUNTS } from '@/lib/dummy-accounts'
import { createClient } from '@/lib/supabase/client'
import { usePresence } from '@/components/presence-provider'

interface Message {
  id: string
  sender: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  content: string
  timestamp: string
  isRead: boolean
}

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const initialUser = searchParams.get('user')
  const { onlineUserIds } = usePresence()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [selectedConversation?.messages])

  useEffect(() => {
    async function initConvos() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: currUser } = await supabase.from('users').select('*').eq('id', user.id).single()
      setCurrentUser(currUser)

      // Load dummy messages from localStorage
      const localDummy = localStorage.getItem(`dummy_msgs_${user.id}`)
      let dummyConvos: Conversation[] = localDummy ? JSON.parse(localDummy) : []

      // Load real messages from Supabase
      const { data: realMessages } = await supabase
        .from('messages')
        .select(`*, sender:sender_id(*), receiver:receiver_id(*)`)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      const realConvosMap = new Map<string, Conversation>()

      if (realMessages) {
        realMessages.forEach((msg: any) => {
          const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
          if (!otherUser) return

          if (!realConvosMap.has(otherUser.id)) {
            realConvosMap.set(otherUser.id, {
              id: otherUser.id,
              user: {
                id: otherUser.id,
                name: otherUser.full_name,
                username: otherUser.username,
                avatar: otherUser.avatar_url,
              },
              lastMessage: '',
              lastMessageTime: '',
              unreadCount: 0,
              messages: []
            })
          }
          const convo = realConvosMap.get(otherUser.id)!
          convo.messages.push({
            id: msg.id,
            sender: {
              id: msg.sender.id,
              name: msg.sender.full_name,
              username: msg.sender.username,
              avatar: msg.sender.avatar_url
            },
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: msg.is_read
          })
          convo.lastMessage = msg.content
          convo.lastMessageTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      }

      const combined = [...dummyConvos, ...Array.from(realConvosMap.values())]

      if (initialUser) {
        const existing = combined.find(c => c.user.username === initialUser)
        if (existing) {
          setSelectedConversation(existing)
        } else {
          // Check if dummy user
          const dummyUser = DUMMY_ACCOUNTS.find(a => a.username === initialUser)
          if (dummyUser) {
            const newConvo: Conversation = {
              id: dummyUser.id,
              user: {
                id: dummyUser.id, name: dummyUser.full_name, username: dummyUser.username,
              },
              lastMessage: '', lastMessageTime: '', unreadCount: 0, messages: []
            }
            combined.unshift(newConvo)
            setSelectedConversation(newConvo)
          } else {
            // Check real user
            const { data: realUser } = await supabase.from('users').select('*').eq('username', initialUser).single()
            if (realUser) {
              const newConvo: Conversation = {
                id: realUser.id,
                user: {
                  id: realUser.id, name: realUser.full_name, username: realUser.username,
                  avatar: realUser.avatar_url,
                },
                lastMessage: '', lastMessageTime: '', unreadCount: 0, messages: []
              }
              combined.unshift(newConvo)
              setSelectedConversation(newConvo)
            }
          }
        }
      }
      setConversations(combined)
    }
    initConvos()
  }, [initialUser])

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, async (payload) => {
        const msg = payload.new
        
        // Fetch sender details to update UI properly
        const { data: sender } = await supabase.from('users').select('*').eq('id', msg.sender_id).single()
        if (!sender) return

        const formattedMsg: Message = {
          id: msg.id,
          sender: { id: sender.id, name: sender.full_name, username: sender.username, avatar: sender.avatar_url },
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        }

        setConversations(prev => {
          const exists = prev.find(c => c.id === sender.id)
          if (exists) {
            return prev.map(c => c.id === sender.id ? {
              ...c,
              messages: [...c.messages, formattedMsg],
              lastMessage: formattedMsg.content,
              lastMessageTime: formattedMsg.timestamp,
              unreadCount: selectedConversation?.id === c.id ? 0 : c.unreadCount + 1
            } : c)
          } else {
            return [{
              id: sender.id,
              user: { id: sender.id, name: sender.full_name, username: sender.username, avatar: sender.avatar_url },
              lastMessage: formattedMsg.content,
              lastMessageTime: formattedMsg.timestamp,
              unreadCount: 1,
              messages: [formattedMsg]
            }, ...prev]
          }
        })
        
        setSelectedConversation(prev => {
          if (prev?.id === sender.id) {
            return {
              ...prev,
              messages: [...prev.messages, formattedMsg],
              lastMessage: formattedMsg.content,
              lastMessageTime: formattedMsg.timestamp
            }
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, selectedConversation?.id])

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    const messageContent = newMessage
    setNewMessage('') // clear input immediately

    const isDummy = DUMMY_ACCOUNTS.some(a => a.id === selectedConversation.id)
    
    const formattedMsg: Message = {
      id: Date.now().toString(),
      sender: { id: currentUser.id, name: currentUser.full_name, username: currentUser.username, avatar: currentUser.avatar_url },
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    }

    // Optimistic UI update
    const updateState = (prev: Conversation[]) => {
      return prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, formattedMsg],
              lastMessage: formattedMsg.content,
              lastMessageTime: formattedMsg.timestamp,
            }
          : conv
      )
    }

    setConversations(updateState)
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, formattedMsg],
      lastMessage: formattedMsg.content,
      lastMessageTime: formattedMsg.timestamp
    } : null)

    if (isDummy) {
      // Save to localStorage
      const updatedConvos = updateState(conversations).filter(c => DUMMY_ACCOUNTS.some(a => a.id === c.id))
      localStorage.setItem(`dummy_msgs_${currentUser.id}`, JSON.stringify(updatedConvos))
    } else {
      // Save to Supabase
      const supabase = createClient()
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedConversation.id,
        content: messageContent
      })
    }
  }

  return (
    <div className="h-[calc(100dvh-137px)] md:h-[calc(100vh-73px)] border-t border-border w-full flex bg-background">
      {/* Conversations List - Sidebar */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => {
            const isOnline = onlineUserIds.has(conv.id)
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-border text-left transition ${
                  selectedConversation?.id === conv.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {conv.user.avatar ? (
                        <img src={conv.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold">{conv.user.name.charAt(0)}</span>
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-clamp-1">{conv.user.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{conv.lastMessageTime}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 flex items-center justify-between bg-background/80 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-3 group">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Link
                  href={`/dashboard/profile/${selectedConversation.user.username}`}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {selectedConversation.user.avatar ? (
                        <img src={selectedConversation.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold">{selectedConversation.user.name.charAt(0)}</span>
                      )}
                    </div>
                    {onlineUserIds.has(selectedConversation.id) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
                    )}
                  </div>
                  <div className="group-hover:text-primary transition">
                    <p className="font-semibold">{selectedConversation.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {onlineUserIds.has(selectedConversation.id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </Link>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender.id === currentUser?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-background/80 backdrop-blur">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center h-[calc(100vh-73px)]">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
