"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { PaperAvatar } from "@/components/paper-avatar"

function generateSeed() {
  return `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function BotAvatarPicker() {
  const [seed, setSeed] = useState("Felix")

  return (
    <div className="flex items-center gap-4">
      <PaperAvatar
        seed={seed}
        alt="Bot avatar preview"
        className="size-16 rounded-xl"
        provider="dicebear"
      />

      <div className="space-y-2">
        <input type="hidden" name="avatar" value={seed} />

        <button
          type="button"
          onClick={() => setSeed(generateSeed())}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E7E7E7] bg-white px-3 py-2 text-sm font-medium text-[#111111] transition-colors hover:bg-[#FFF2EC] hover:border-[#FF6A2A]"
        >
          <RefreshCw className="size-4" />
          Change avatar
        </button>

        <p className="text-xs text-[#737373]">
          Generate a new avatar with one click.
        </p>
      </div>
    </div>
  )
}