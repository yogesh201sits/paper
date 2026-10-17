"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircle, RotateCcw } from "lucide-react"

import { retryAssistantResponse } from "@/app/chats/actions"

function RetryButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#B94719] transition hover:bg-[#FFF2EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A2A]/40 disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-3 animate-spin" />
      ) : (
        <RotateCcw className="size-3" />
      )}
      {pending ? "Retrying…" : "Try again"}
    </button>
  )
}

export function RetryResponseForm({
  chatId,
  assistantMessageId,
}: {
  chatId: string
  assistantMessageId: string
}) {
  return (
    <form action={retryAssistantResponse} className="mt-1">
      <input type="hidden" name="chatId" value={chatId} />
      <input
        type="hidden"
        name="assistantMessageId"
        value={assistantMessageId}
      />
      <RetryButton />
    </form>
  )
}
