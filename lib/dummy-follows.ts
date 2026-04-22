// Persists which dummy accounts the current user follows in localStorage

export const getDummyFollowsKey = (userId: string) => `resonance_dummy_follows_${userId}`

export function getDummyFollows(userId: string): string[] {
  if (typeof window === 'undefined' || !userId) return []
  try {
    const stored = localStorage.getItem(getDummyFollowsKey(userId))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function isDummyFollowing(username: string, userId: string): boolean {
  return getDummyFollows(userId).includes(username)
}

/** Toggles follow. Returns the new following state (true = now following). */
export function toggleDummyFollow(username: string, userId: string): boolean {
  if (!userId) return false
  const follows = getDummyFollows(userId)
  const isNowFollowing = !follows.includes(username)
  const key = getDummyFollowsKey(userId)
  if (isNowFollowing) {
    localStorage.setItem(key, JSON.stringify([...follows, username]))
  } else {
    localStorage.setItem(key, JSON.stringify(follows.filter(u => u !== username)))
  }
  return isNowFollowing
}
