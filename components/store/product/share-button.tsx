'use client'

import { Share2 } from 'lucide-react'

type ShareButtonProps = {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  async function handleShare() {
    const fullUrl = `${window.location.origin}${url}`

    if (navigator.share) {
      // Native share sheet on mobile
      try {
        await navigator.share({ title, url: fullUrl })
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard on desktop
      try {
        await navigator.clipboard.writeText(fullUrl)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <Share2 size={16} />
      Share
    </button>
  )
}
