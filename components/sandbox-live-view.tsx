"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Activity, Circle, LoaderCircle, Monitor } from "lucide-react"

import { getSharedSandboxScreen } from "@/app/sandbox/actions"

type SandboxFrame = Awaited<ReturnType<typeof getSharedSandboxScreen>>

type SandboxLiveViewProps = {
  enabled: boolean
  statusMessage?: string
}

export function SandboxLiveView({
  enabled,
  statusMessage,
}: SandboxLiveViewProps) {
  const [frame, setFrame] = useState<SandboxFrame | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    async function refreshScreen() {
      try {
        const nextFrame = await getSharedSandboxScreen()
        if (!disposed) {
          setFrame(nextFrame)
          setError(null)
          setUpdatedAt(new Date())
        }
      } catch (cause) {
        if (!disposed) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not capture the sandbox desktop."
          )
        }
      } finally {
        if (!disposed) timeout = setTimeout(refreshScreen, 2000)
      }
    }

    void refreshScreen()
    return () => {
      disposed = true
      if (timeout) clearTimeout(timeout)
    }
  }, [enabled])

  return (
    <section
      aria-label="Sandbox live desktop"
      className="overflow-hidden rounded-2xl border border-[#E7E7E7] bg-white shadow-[5px_5px_12px_#dedede,-5px_-5px_12px_#ffffff]"
    >
      <div className="flex items-center justify-between border-b border-[#E7E7E7] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#FFF2EC] text-[#FF6A2A]">
            <Monitor className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Live desktop</h2>
            <p className="mt-0.5 text-xs text-[#737373]">
              See what agents are doing
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F4] px-2.5 py-1 text-xs font-medium text-[#525252]">
          {enabled ? (
            <>
              <Circle className="size-2 fill-emerald-500 text-emerald-500" />
              {error ? "Reconnecting" : "Live"}
            </>
          ) : (
            <>
              <Circle className="size-2 fill-[#A3A3A3] text-[#A3A3A3]" />
              Offline
            </>
          )}
        </span>
      </div>

      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#171717]">
        {frame ? (
          <Image
            src={`data:${frame.mediaType};base64,${frame.base64}`}
            alt="Current desktop screen in the shared Daytona sandbox"
            width={frame.width || 1280}
            height={frame.height || 720}
            unoptimized
            className="size-full object-contain"
          />
        ) : (
          <div className="flex max-w-xs flex-col items-center px-6 text-center text-white">
            {enabled ? (
              <LoaderCircle className="size-7 animate-spin text-white/70" />
            ) : (
              <Monitor className="size-7 text-white/60" />
            )}
            <p className="mt-4 text-sm font-medium">
              {enabled ? "Connecting to the desktop..." : "Desktop is offline"}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              {enabled
                ? "The live screen will appear here."
                : "Start the sandbox to view its desktop."}
            </p>
          </div>
        )}
        {enabled && frame && (
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-black/65 px-2 py-1 text-[11px] text-white">
            <Activity className="size-3" />
            {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "Live"}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          {error}
        </p>
      )}
      {!enabled && statusMessage && (
        <p
          role="status"
          className="border-t border-[#E7E7E7] px-4 py-3 text-xs leading-5 text-[#737373]"
        >
          {statusMessage}
        </p>
      )}
    </section>
  )
}
