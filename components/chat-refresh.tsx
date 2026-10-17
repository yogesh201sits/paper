
"use client"

import { useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"

type ChatRefreshProps = {
  hasPendingMessages: boolean
}

export function ChatRefresh({ hasPendingMessages }: ChatRefreshProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!hasPendingMessages) return

    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh()
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [hasPendingMessages, router])

  return null
}
