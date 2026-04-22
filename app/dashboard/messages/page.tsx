'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Search, MoreVertical } from 'lucide-react'

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
    isOnline: boolean
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      sender: { id: 'me', name: 'You', username: 'yourname' },
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: newMessage,
              lastMessageTime: 'now',
            }
          : conv
      )
    )

    setNewMessage('')
  }

  return (
    <div className="h-[calc(100vh-73px)] border-t border-border w-full flex bg-background">
      {/* Conversations List - Sidebar */}
      <div className="w-80 border-r border-border flex flex-col hidden md:flex">
        {/* Header */}
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

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
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
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold">
                      {conv.user.name.charAt(0)}
                    </span>
                  </div>
                  {conv.user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{conv.user.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {conv.lastMessage}
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
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 flex items-center justify-between bg-background/80 backdrop-blur sticky top-0 z-10">
              <Link
                href={`/dashboard/profile/${selectedConversation.user.username}`}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold">
                      {selectedConversation.user.name.charAt(0)}
                    </span>
                  </div>
                  {selectedConversation.user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
                  )}
                </div>
                <div className="group-hover:text-primary transition">
                  <p className="font-semibold">{selectedConversation.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.user.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </Link>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender.id === 'me' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender.id === 'me'
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
