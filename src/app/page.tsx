import Link from 'next/link'
import classNames from 'classnames'
import classNames from 'classnames'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">TikTok Clone</h1>
        <Link href="/login" className={classNames('px-4', 'py-2', 'bg-black', 'text-white', 'rounded')}>Login</Link>
        <Link href="/register" className={classNames('px-4', 'py-2', 'border', 'border-black', 'rounded')}>Register</Link>
        <Link href="/register" className={classNames('px-4', 'py-2', 'border', 'border-black', 'rounded')}>Register</Link>
      </div>
    </main>
  )
}