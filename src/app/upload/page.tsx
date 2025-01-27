import { UploadForm } from '@/components/components'

export default function UploadPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
        <UploadForm />
      </div>
    </div>
  )
}