// src/lib/utils.ts
import { PrismaClient } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { createUploadthing, type FileRouter } from "uploadthing/next"

declare module 'next-auth' {
    interface Session {
      user: {
        id: string;
        email: string;
        name?: string;
        image?: string;
      }
    }
  }
// Initialize Prisma
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Auth functions
export async function hashPassword(password: string) {
  return await hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword)
}

// Video upload configuration
export const f = createUploadthing()
export const uploadRouter = {
  videoUploader: f({ video: { maxFileSize: "64MB" } })
    .middleware(async () => {
      const session = await getServerSession()
      if (!session) throw new Error("Unauthorized")
      if (!session.user) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const video = await prisma.video.create({
        data: {
          url: file.url,
          userId: metadata.userId,
        },
      })
      return { videoId: video.id }
    }),
} satisfies FileRouter

// Recommendation engine
export async function getRecommendedVideos(userId: string | null, count = 20) {
  const videos = await prisma.video.findMany({
    take: count,
    orderBy: [
      { createdAt: 'desc' },
      { views: 'desc' }
    ],
    include: {
      user: {
        select: {
          username: true,
          image: true
        }
      },
      likes: true,
      comments: true
    }
  })
  return videos
}