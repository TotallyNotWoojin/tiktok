// src/app/api/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma, hashPassword, verifyPassword } from '@/lib/utils'

// Auth endpoints
export async function POST(request: Request) {
  const body = await request.json()
  const { type, email, password, username } = body

  if (type === 'register') {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })
    if (existingUser) {
      return NextResponse.json({ error: 'User exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword }
    })
    return NextResponse.json({ user })
  }

  if (type === 'login') {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !await verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    return NextResponse.json({ user })
  }
}

// Video endpoints
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const session = await getServerSession()

  if (type === 'feed') {
    const category = searchParams.get('category')
    const hashtag = searchParams.get('hashtag')

    const whereClause: any = {}
    
    if (category) {
        whereClause.category = category
    }

    if (hashtag) {
        whereClause.hashtags = {
            some: {
                name: hashtag.replace('#', '')
            }
        }
    }

    const videos = await prisma.video.findMany({
        take: 20,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            user: true,
            likes: true,
            comments: true,
        }
    })
    return NextResponse.json(videos)
  }

  if (type === 'categories') {
    const videos = await prisma.video.groupBy({
        by: ['category'],
        _count: {
            _all: true
        },
        where: {
            NOT: {
                category: { not: null }
            }
        }
    })
    return NextResponse.json(videos)
  }

  if (type === 'trending-hashtags') {
    const hashtags = await prisma.hashtag.findMany({
        take: 10,
        include: {
            _count: {
                select: { videos: true }
            }
        },
        orderBy: {
            videos: {
                _count: 'desc'
            }
        }
    })
    return NextResponse.json(hashtags)
  }

  if (type === 'like') {
    const videoId = searchParams.get('videoId')
    if (!session?.user?.id || !videoId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const like = await prisma.like.create({
      data: {
        userId: session.user.id,
        videoId
      }
    })
    return NextResponse.json(like)
  }

  if (type === 'comment') {
    const videoId = searchParams.get('videoId')
    const text = searchParams.get('text')
    if (!session?.user?.id || !videoId || !text) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        userId: session.user.id,
        videoId
      }
    })
    return NextResponse.json(comment)
  }

  // Handle video upload
  if (type === 'upload') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    formData.get('video') as File
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const hashtagsJson = formData.get('hashtags') as string
    const hashtags = JSON.parse(hashtagsJson)

    try {
      const newVideo = await prisma.video.create({
        data: {
          url: 'temp_url', // Replace with actual upload logic
          description,
          category,
          userId: session.user.id,
          hashtags: {
            connectOrCreate: hashtags.map((tag: string) => ({
              where: { name: tag.replace('#', '') },
              create: { name: tag.replace('#', '') }
            }))
          }
        }
      })
      return NextResponse.json(newVideo)
    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
}