'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'wd-announcement-dismissed'

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-primary text-primary-foreground text-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 h-10 relative">
        <p className="text-center">
          Get{' '}
          <span className="font-bold text-accent">10% off</span>
          {' '}your first order — use code{' '}
          <span className="font-bold text-accent tracking-wide">FIRST10</span>
          <span className="hidden sm:inline text-primary-foreground/60 mx-2">·</span>
          <span className="hidden sm:inline font-semibold text-accent">Free shipping</span>
          <span className="hidden sm:inline"> over Rs. 5,000</span>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/60 hover:text-primary-foreground transition-colors p-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
