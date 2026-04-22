'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Music, Plus, Edit, Trash2, Play, Pause, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Track {
  id: string
  title: string
  genre: string
  description?: string
  audio_url: string
  plays: number
  likes: number
  created_at: string
}

export default function ArtistMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [newTrack, setNewTrack] = useState({
    title: '',
    genre: '',
    description: ''
  })

  // Playback state
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', genre: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false })

    if (data && !error) {
      const formatted = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        genre: t.genre,
        description: t.description,
        audio_url: t.audio_url,
        plays: t.play_count || 0,
        likes: t.likes_count || 0,
        created_at: new Date(t.created_at).toISOString().split('T')[0]
      }))
      setTracks(formatted)
    }
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!newTrack.title || !newTrack.genre || !audioFile) {
      alert('Title, genre and an audio file are required!')
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = audioFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, audioFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from('music_tracks')
        .insert({
          artist_id: user.id,
          title: newTrack.title,
          genre: newTrack.genre,
          description: newTrack.description,
          audio_url: publicUrl
        })

      if (insertError) throw insertError

      await fetchTracks()
      setNewTrack({ title: '', genre: '', description: '' })
      setAudioFile(null)
      setShowUploadForm(false)
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string, audioUrl: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return

    try {
      const supabase = createClient()
      
      // Delete from db
      const { error } = await supabase.from('music_tracks').delete().eq('id', id)
      if (error) throw error

      // Optimistically we could delete from storage too if we parse the fileName from URL 
      // but deleting from DB is sufficient to hide it.
      
      setTracks(tracks.filter((t) => t.id !== id))
      if (playingId === id) {
        setPlayingId(null)
        if (audioRef.current) audioRef.current.pause()
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message)
    }
  }

  const handleEditSave = async (id: string) => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('music_tracks').update({
        title: editForm.title,
        genre: editForm.genre,
        description: editForm.description
      }).eq('id', id)

      if (error) throw error

      setTracks(tracks.map(t => t.id === id ? { ...t, ...editForm } : t))
      setEditingId(null)
    } catch (err: any) {
      alert('Edit failed: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
      setPlayingId(id)
    }
  }

  if (loading) {
     return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Hidden audio element for global playback logic */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Upload Music</h1>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isUploading}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Track
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="p-6 border-border mb-8">
          <h2 className="text-2xl font-bold mb-6">Upload New Track</h2>

          <div className="space-y-4">
            {/* File Upload Area */}
            <div className={`relative border-2 border-dashed rounded-lg p-12 text-center transition ${audioFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {audioFile ? (
                <p className="font-semibold text-primary">{audioFile.name}</p>
              ) : (
                <>
                  <p className="font-semibold mb-2">Select your audio file</p>
                  <p className="text-sm text-muted-foreground mb-4">MP3, WAV, FLAC</p>
                </>
              )}
              <input 
                type="file" 
                accept="audio/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Track Title</label>
                <Input
                  placeholder="Enter track title"
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <Input
                  placeholder="e.g. Electronic, Hip-hop, Pop"
                  value={newTrack.genre}
                  onChange={(e) => setNewTrack({ ...newTrack, genre: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Describe your track..."
                className="w-full px-3 py-2 border border-input rounded-md bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[100px]"
                value={newTrack.description}
                onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleUpload} disabled={isUploading} className="bg-primary text-primary-foreground">
                {isUploading ? <><Loader2 className="animate-spin h-4 w-4 mr-2"/> Uploading...</> : 'Upload Track'}
              </Button>
              <Button variant="outline" onClick={() => setShowUploadForm(false)} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tracks List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Your Tracks</h2>

        {tracks.length === 0 ? (
          <Card className="p-8 text-center border-border">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tracks Yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first track to get started</p>
          </Card>
        ) : (
          tracks.map((track) => (
            <Card key={track.id} className="p-4 border-border hover:border-primary/50 transition">
              {editingId === track.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs mb-1 block">Title</label>
                      <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block">Genre</label>
                      <Input value={editForm.genre} onChange={e => setEditForm({...editForm, genre: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block">Description</label>
                    <Input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={isSaving}>Cancel</Button>
                    <Button size="sm" onClick={() => handleEditSave(track.id)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-1"/>} Save
                    </Button>
                  </div>
                </div>
              ) : (
                // Read Mode
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button 
                      variant="default"
                      size="icon" 
                      className={`w-12 h-12 flex-shrink-0 transition-colors ${playingId === track.id ? 'bg-primary animate-pulse text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30 text-primary'}`}
                      onClick={() => togglePlay(track.id, track.audio_url)}
                    >
                      {playingId === track.id ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-1 fill-current" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-lg">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">{track.genre}</p>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div className="text-right">
                      <p>Plays</p>
                      <p className="font-semibold text-foreground">{track.plays.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p>Likes</p>
                      <p className="font-semibold text-foreground">{track.likes.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p>Uploaded</p>
                      <p className="font-semibold text-foreground">{track.created_at}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditForm({ title: track.title, genre: track.genre, description: track.description || '' })
                        setEditingId(track.id)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(track.id, track.audio_url)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </main>
  )
}
