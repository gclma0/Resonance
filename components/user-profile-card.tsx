'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Link as LinkIcon, Music, Users, Camera, Loader2, MessageSquare, Headphones } from 'lucide-react'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface UserProfileCardProps {
  userId?: string
  username: string
  fullName: string
  avatar?: string
  cover?: string
  bio?: string
  userType: 'artist' | 'listener'
  followersCount: number
  followingCount: number
  postsCount?: number
  isOwnProfile?: boolean
  isFollowing?: boolean
  onFollow?: () => void
}

export function UserProfileCard({
  userId,
  username,
  fullName,
  avatar: initialAvatar,
  cover,
  bio,
  userType,
  followersCount,
  followingCount,
  postsCount = 0,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
}: UserProfileCardProps) {
  const [currentAvatar, setCurrentAvatar] = useState(initialAvatar)
  const [currentFullName, setCurrentFullName] = useState(fullName)
  const [currentBio, setCurrentBio] = useState(bio)
  
  const [isUploading, setIsUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [editFullName, setEditFullName] = useState(fullName)
  const [editBio, setEditBio] = useState(bio || '')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    try {
      setIsUploading(true)
      const supabase = createClient()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentAvatar(publicUrl)
      // Force reload page to sync navbar
      window.location.reload()
    } catch (err: any) {
      alert('Error uploading avatar: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ full_name: editFullName, bio: editBio })
        .eq('id', userId)

      if (error) throw error
      
      setCurrentFullName(editFullName)
      setCurrentBio(editBio)
      setIsEditing(false)
    } catch (err: any) {
      alert('Error saving profile: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Cover Image */}
      <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg mb-4 overflow-hidden relative">
        {cover ? (
          <img src={cover} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <Card className="p-4 sm:p-6 border-border -mt-12 sm:-mt-16 relative z-10 mx-2 sm:mx-0">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-4 border-background">
              {currentAvatar ? (
                <img src={currentAvatar} alt={fullName} className="w-full h-full object-cover z-0" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground z-0">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isOwnProfile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg m-1 z-10"
              >
                {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{currentFullName}</h1>
                <p className="text-muted-foreground">@{username}</p>
              </div>

              {!isOwnProfile && (
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/messages?user=${username}`}>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Message
                    </Button>
                  </Link>
                  <Button
                    onClick={onFollow}
                    className={`${
                      isFollowing
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>

            {/* User Type Badge */}
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
                {userType === 'artist' ? <Music className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                {userType === 'artist' ? 'Artist' : 'Listener'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {currentBio && (
          <p className="text-foreground mb-4">
            {currentBio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 py-4 border-t border-b border-border my-4">
          <Link href={`/dashboard/profile/${username}/followers`} className="hover:bg-muted/50 p-2 rounded-lg transition text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold hover:text-primary transition-colors">{followersCount.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
          </Link>
          <Link href={`/dashboard/profile/${username}/following`} className="hover:bg-muted/50 p-2 rounded-lg transition text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold hover:text-primary transition-colors">{followingCount.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
          </Link>
          <div className="p-2 text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold">{postsCount.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Posts</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Bangladesh</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <LinkIcon className="h-4 w-4" />
            <span>resonance.com</span>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background space-y-4 border-border">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea 
                className="w-full flex min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                value={editBio} 
                onChange={e => setEditBio(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
