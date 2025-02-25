'use client'
// src/components/components.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactPlayer from 'react-player'
import { useInView } from 'react-intersection-observer'

// Auth Components
export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api', {
        method: 'POST',
        body: JSON.stringify({
          type: 'login',
          email: formData.get('email'),
          password: formData.get('password')
        })
      })
      if (res.ok) router.push('/feed')
      else setError('Invalid credentials')
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="email" type="email" placeholder="Email" required className="w-full p-2 border rounded" />
      <input name="password" type="password" placeholder="Password" required className="w-full p-2 border rounded" />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="w-full p-2 bg-black text-white rounded">Login</button>
    </form>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api', {
        method: 'POST',
        body: JSON.stringify({
          type: 'register',
          email: formData.get('email'),
          username: formData.get('username'),
          password: formData.get('password')
        })
      })
      if (res.ok) router.push('/login')
      else setError('Registration failed')
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="email" type="email" placeholder="Email" required className="w-full p-2 border rounded" />
      <input name="username" type="text" placeholder="Username" required className="w-full p-2 border rounded" />
      <input name="password" type="password" placeholder="Password" required className="w-full p-2 border rounded" />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="w-full p-2 bg-black text-white rounded">Register</button>
    </form>
  )
}

// Video Components
export function VideoFeed() {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch('/api?type=feed')
      .then(res => res.json())
      .then(setVideos)
  }, [])

  return (
    <div className="h-screen snap-y snap-mandatory overflow-scroll">
      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} isActive={currentIndex === index} />
      ))}
    </div>
  )
}

interface Video {
  id: string;
  url: string;
  description: string;
  category?: string;
  hashtags?: { id: string; name: string }[];
}

export function VideoCard({ video, isActive }: { video: Video; isActive: boolean }) {
  const [liked, setLiked] = useState(false)
  const { ref, inView } = useInView({ threshold: 0.5 })

  const handleLike = async () => {
    try {
      await fetch(`/api?type=like&videoId=${video.id}`)
      setLiked(true)
    } catch (err) {
      console.error('Failed to like video:', err)
    }
  }

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\w]+/g;
    return text?.match(hashtagRegex) || [];
  };

  return (
    <div ref={ref} className="h-screen snap-start">
      <ReactPlayer
        url={video.url}
        playing={isActive && inView}
        loop
        width="100%"
        height="100%"
      />
      <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/60 w-full">
        {video.category && (
          <span className="inline-block px-2 py-1 bg-blue-500 text-white rounded-full text-sm mb-2">
            {video.category}
          </span>
        )}
        <p className="text-white mb-2">{video.description}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {video.hashtags?.map((tag) => (
            <span key={tag.id} className="text-blue-400">
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleLike} className="p-2 bg-red-500 text-white rounded">
            {liked ? 'Liked' : 'Like'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Upload Component
export function UploadForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  const categories = [
    'Comedy', 'Music', 'Dance', 'Sports', 'Food', 
    'Fashion', 'Beauty', 'Education', 'Travel', 'Gaming'
  ]

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\w]+/g;
    return Array.from(new Set(text.match(hashtagRegex) || []));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('video', e.target.files[0])
    formData.append('description', description)
    formData.append('category', category)
    
    // Extract hashtags from description
    const hashtags = extractHashtags(description)
    formData.append('hashtags', JSON.stringify(hashtags))

    try {
      await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      router.push('/feed')
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4">
      <input type="file" accept="video/*" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}