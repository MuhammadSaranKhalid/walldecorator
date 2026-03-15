'use client'

import { useRef, useEffect, useState } from 'react'

type FadeInSectionProps = {
  children: React.ReactNode
  className?: string
  /** Delay in ms before animation starts after element enters viewport */
  delay?: number
}

/**
 * Wraps any homepage section with a scroll-triggered fade-in-up animation.
 * Respects prefers-reduced-motion — skips animation entirely for users who opt out.
 * Observer disconnects after first trigger to avoid repeat animations.
 */
export function FadeInSection({ children, className, delay = 0 }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Check user's motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReducedMotion(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay)
          } else {
            setIsVisible(true)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  // No wrapper needed — just pass children through for reduced-motion users
  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
