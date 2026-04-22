'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/lib/store/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const htmlElement = document.documentElement
    if (theme === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }, [theme])

  if (!mounted) {
    return children
  }

  return children
}
