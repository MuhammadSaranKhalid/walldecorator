'use client'

import { useEffect, useState } from 'react'
import { useToastStore, type Toast } from '@/store/toast.store'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[600] flex flex-col gap-2.5 pointer-events-none items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Progress bar animation
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 16)

    // Exit animation before removal
    const exitTimeout = setTimeout(() => {
      setIsExiting(true)
    }, toast.duration - 300)

    return () => {
      clearInterval(interval)
      clearTimeout(exitTimeout)
    }
  }, [toast.duration])

  const barColorClass =
    toast.type === 'gold'
      ? 'bg-[var(--obsidian-gold)]'
      : toast.type === 'red'
        ? 'bg-[var(--obsidian-red)]'
        : 'bg-[var(--obsidian-text-muted)]'

  return (
    <div
      className={`
        bg-[rgba(17,17,17,0.96)] border border-[var(--obsidian-border)] backdrop-blur-2xl
        px-5 py-3.5 flex items-center gap-3.5 min-w-[280px] pointer-events-auto
        relative overflow-hidden
        ${isExiting ? 'animate-toastOut' : 'animate-toastIn'}
      `}
    >
      {toast.icon && (
        <div className="text-xl flex-shrink-0 leading-none">{toast.icon}</div>
      )}

      <div className="flex-1">
        <div className="text-xs font-medium tracking-wide mb-0.5 leading-tight">
          {toast.title}
        </div>
        {toast.subtitle && (
          <div className="text-[11px] text-[var(--obsidian-text-muted)] leading-tight">
            {toast.subtitle}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-[16ms] linear"
        style={{ width: `${progress}%` }}
      >
        <div className={`h-full ${barColorClass}`} />
      </div>
    </div>
  )
}
