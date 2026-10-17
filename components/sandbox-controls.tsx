"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, LoaderCircle, Play } from "lucide-react"

import { provisionSharedSandbox } from "@/app/sandbox/actions"

type SandboxControlsProps = {
  ready: boolean
  hasSandbox: boolean
  configured: boolean
}

export function SandboxControls({
  ready,
  hasSandbox,
  configured,
}: SandboxControlsProps) {
  const router = useRouter()
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const waiting = isProvisioning && !ready && attempts < 45

  useEffect(() => {
    if (!waiting) return

    const timeout = setTimeout(() => {
      setAttempts((count) => count + 1)
      router.refresh()
    }, 2000)

    return () => clearTimeout(timeout)
  }, [attempts, router, waiting])

  function provision() {
    setError(null)
    startTransition(async () => {
      try {
        await provisionSharedSandbox()
        setAttempts(0)
        setIsProvisioning(true)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not start sandbox provisioning."
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={provision}
        disabled={isPending || waiting || !configured || ready}
        className="inline-flex items-center gap-2 rounded-xl bg-[#FF6A2A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ed5920] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ready ? (
          <Check className="size-4" />
        ) : isPending || waiting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {waiting
          ? "Starting shared sandbox..."
          : ready
            ? "Shared sandbox is running"
            : hasSandbox
              ? "Wake shared sandbox"
              : "Create shared sandbox"}
      </button>
      {isProvisioning && attempts >= 45 && !ready && (
        <p className="text-sm text-red-700">
          Provisioning is taking longer than expected. Refresh the page to check
          again.
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
