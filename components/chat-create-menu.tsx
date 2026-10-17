import Link from "next/link"
import { MessageSquarePlus, Plus, Users } from "lucide-react"

export function ChatCreateMenu() {
  return (
    <details className="group relative">
      <summary
        aria-label="Create a chat"
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg border border-[#E7E7E7] text-[#737373] transition hover:border-[#FF6A2A] hover:bg-[#FFF2EC] hover:text-[#FF6A2A] [&::-webkit-details-marker]:hidden"
      >
        <Plus className="size-4 transition-transform group-open:rotate-45" />
      </summary>
      <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-[#E7E7E7] bg-white p-1.5 shadow-lg">
        <Link
          href="/chats#new-chat"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[#FFF2EC]"
        >
          <MessageSquarePlus className="size-4 text-[#FF6A2A]" />
          New chat
        </Link>
        <Link
          href="/chats#new-group"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[#FFF2EC]"
        >
          <Users className="size-4 text-[#FF6A2A]" />
          New group
        </Link>
      </div>
    </details>
  )
}
