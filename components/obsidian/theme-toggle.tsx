"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 border border-[var(--obsidian-border)]" aria-hidden />
    )
  }

  const isDark = resolvedTheme === "dark"

  const cycle = () => {
    if (theme === "dark") setTheme("light")
    else if (theme === "light") setTheme("system")
    else setTheme("dark")
  }

  const label =
    theme === "dark" ? "Switch to light mode"
    : theme === "light" ? "Switch to system mode"
    : "Switch to dark mode"

  const Icon =
    theme === "system" ? Monitor
    : isDark ? Moon
    : Sun

  return (
    <button
      onClick={cycle}
      aria-label={label}
      title={label}
      className="relative bg-transparent border border-[var(--obsidian-border)] text-[var(--obsidian-text-muted)] w-9 h-9 flex items-center justify-center cursor-pointer transition-all duration-250 hover:border-[var(--obsidian-gold)] hover:text-[var(--obsidian-gold)]"
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
