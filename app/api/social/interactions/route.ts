import { NextRequest, NextResponse } from 'next/server'

// Mock database
const postLikes = new Map<string, Set<string>>() // postId -> userId[]
const musicLikes = new Map<string, Set<string>>() // musicId -> userId[]
const postComments = new Map<string, any[]>() // postId -> comments[]

interface LikeRequest {
  action: 'like' | 'unlike'
  contentId: string
  contentType: 'post' | 'music'
  userId: string
}

interface CommentRequest {
  action: 'add' | 'delete'
  postId: string
  userId: string
  content?: string
  commentId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.contentType) {
      // Handle likes
      const { action, contentId, contentType, userId }: LikeRequest = body

      if (!contentId || !userId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const likesMap = contentType === 'post' ? postLikes : musicLikes

      if (!likesMap.has(contentId)) {
        likesMap.set(contentId, new Set())
      }

      if (action === 'like') {
        likesMap.get(contentId)!.add(userId)
        console.log(`[v0] ${userId} liked ${contentType} ${contentId}`)
      } else if (action === 'unlike') {
        likesMap.get(contentId)!.delete(userId)
        console.log(`[v0] ${userId} unliked ${contentType} ${contentId}`)
      }

      return NextResponse.json({
        success: true,
        action,
        contentId,
        contentType,
        userId,
        likeCount: likesMap.get(contentId)!.size,
      })
    } else {
      // Handle comments
      const { action, postId, userId, content, commentId }: CommentRequest = body

      if (!postId || !userId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      if (!postComments.has(postId)) {
        postComments.set(postId, [])
      }

      if (action === 'add' && content) {
        const comment = {
          id: `comment_${Date.now()}`,
          postId,
          userId,
          content,
          createdAt: new Date().toISOString(),
          likes: 0,
        }
        postComments.get(postId)!.push(comment)
        console.log(`[v0] Added comment to post ${postId}`)

        return NextResponse.json({
          success: true,
          action,
          comment,
        })
      } else if (action === 'delete' && commentId) {
        const comments = postComments.get(postId)!
        const index = comments.findIndex((c) => c.id === commentId)
        if (index > -1) {
          comments.splice(index, 1)
          console.log(`[v0] Deleted comment ${commentId}`)
        }

        return NextResponse.json({
          success: true,
          action,
          commentId,
        })
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Interaction error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const contentId = request.nextUrl.searchParams.get('contentId')
    const contentType = request.nextUrl.searchParams.get('type')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (contentType === 'post') {
      const comments = postComments.get(contentId) || []
      const likes = postLikes.get(contentId) || new Set()
      const isLiked = userId ? likes.has(userId) : false

      return NextResponse.json({
        contentId,
        contentType,
        likeCount: likes.size,
        commentCount: comments.length,
        isLiked,
        comments,
      })
    } else if (contentType === 'music') {
      const likes = musicLikes.get(contentId) || new Set()
      const isLiked = userId ? likes.has(userId) : false

      return NextResponse.json({
        contentId,
        contentType,
        likeCount: likes.size,
        isLiked,
      })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Get interactions error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
