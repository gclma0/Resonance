import { NextRequest, NextResponse } from 'next/server'

// Mock database - replace with Supabase in production
const followers = new Map<string, Set<string>>()
const likedPosts = new Map<string, Set<string>>()
const likedMusic = new Map<string, Set<string>>()

// Follow/Unfollow endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, targetId } = body

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'follow') {
      if (!followers.has(userId)) {
        followers.set(userId, new Set())
      }
      followers.get(userId)!.add(targetId)
      console.log(`[v0] ${userId} followed ${targetId}`)
    } else if (action === 'unfollow') {
      if (followers.has(userId)) {
        followers.get(userId)!.delete(targetId)
      }
      console.log(`[v0] ${userId} unfollowed ${targetId}`)
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      targetId,
    })
  } catch (error: any) {
    console.error('[v0] Follow error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Get follower count
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const action = request.nextUrl.searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    if (action === 'followers') {
      const userFollowers = Array.from(followers.get(userId) || [])
      return NextResponse.json({
        userId,
        followers: userFollowers,
        count: userFollowers.length,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Get followers error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
