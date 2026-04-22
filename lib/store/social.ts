import { create } from 'zustand'

interface SocialUser {
  id: string
  name: string
  username: string
}

interface SocialStore {
  // Follow state
  following: Set<string>
  followers: Set<string>
  
  // Messages
  conversations: Map<string, string[]> // userId -> messageIds
  
  // Interactions
  likedPosts: Set<string>
  likedMusic: Set<string>
  
  // Actions
  toggleFollow: (userId: string) => void
  isFollowing: (userId: string) => boolean
  getFollowers: () => string[]
  getFollowing: () => string[]
  
  toggleLikePost: (postId: string) => void
  isPostLiked: (postId: string) => boolean
  
  toggleLikeMusic: (musicId: string) => void
  isMusicLiked: (musicId: string) => boolean
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  following: new Set(),
  followers: new Set(),
  conversations: new Map(),
  likedPosts: new Set(),
  likedMusic: new Set(),

  toggleFollow: (userId: string) => {
    set((state) => {
      const newFollowing = new Set(state.following)
      if (newFollowing.has(userId)) {
        newFollowing.delete(userId)
      } else {
        newFollowing.add(userId)
      }
      return { following: newFollowing }
    })
  },

  isFollowing: (userId: string) => {
    return get().following.has(userId)
  },

  getFollowers: () => {
    return Array.from(get().followers)
  },

  getFollowing: () => {
    return Array.from(get().following)
  },

  toggleLikePost: (postId: string) => {
    set((state) => {
      const newLikedPosts = new Set(state.likedPosts)
      if (newLikedPosts.has(postId)) {
        newLikedPosts.delete(postId)
      } else {
        newLikedPosts.add(postId)
      }
      return { likedPosts: newLikedPosts }
    })
  },

  isPostLiked: (postId: string) => {
    return get().likedPosts.has(postId)
  },

  toggleLikeMusic: (musicId: string) => {
    set((state) => {
      const newLikedMusic = new Set(state.likedMusic)
      if (newLikedMusic.has(musicId)) {
        newLikedMusic.delete(musicId)
      } else {
        newLikedMusic.add(musicId)
      }
      return { likedMusic: newLikedMusic }
    })
  },

  isMusicLiked: (musicId: string) => {
    return get().likedMusic.has(musicId)
  },
}))
