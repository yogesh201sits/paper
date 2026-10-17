import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { desc, eq, inArray } from "drizzle-orm"
import { Bot as BotIcon } from "lucide-react"

import { ChatCreateMenu } from "@/components/chat-create-menu"
import { GroupAvatar } from "@/components/group-avatar"
import { PaperAvatar } from "@/components/paper-avatar"
import { db } from "@/db"

import { bots, chatMembers, chats } from "@/db/schema"

type ChatsLayoutProps = {
  children: React.ReactNode
  params: Promise<{ id?: string }>
}

export default async function ChatsLayout({
  children,
  params,
}: ChatsLayoutProps) {
  const { userId } = await auth()
  if (!userId) return children

  const [{ id: activeChatId }, userChats, userBots] = await Promise.all([
    params,
    db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.lastMessageAt)),
    db
      .select({
        id: bots.id,
        name: bots.name,
        job: bots.job,
        avatar: bots.avatar,
      })
      .from(bots)
      .where(eq(bots.userId, userId))
      .orderBy(desc(bots.createdAt)),
  ])

  const memberships = userChats.length
    ? await db
        .select({
          chatId: chatMembers.chatId,
          name: bots.name,
          avatar: bots.avatar,
        })
        .from(chatMembers)
        .innerJoin(bots, eq(chatMembers.botId, bots.id))
        .where(
          inArray(
            chatMembers.chatId,
            userChats.map((chat) => chat.id)
          )
        )
    : []

  const membersByChat = new Map<string, (typeof memberships)[number][]>()
  for (const member of memberships) {
    const members = membersByChat.get(member.chatId) ?? []
    members.push(member)
    membersByChat.set(member.chatId, members)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] md:flex md:h-screen md:min-h-0 md:overflow-hidden">
      <aside className="flex h-48 shrink-0 flex-col border-b border-[#E7E7E7] bg-white md:sticky md:top-0 md:h-screen md:w-72 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/chats" className="text-xl font-bold tracking-tight">
            paper<span className="text-[#FF6A2A]">.</span>
          </Link>
          <ChatCreateMenu bots={userBots} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
          <p className="mb-2 shrink-0 px-1 text-xs font-semibold tracking-wide text-[#737373] uppercase">
            Your chats
          </p>
          <nav
            aria-label="Your chats"
            className="flex min-h-0 gap-2 overflow-x-auto md:flex-col md:overflow-x-hidden md:overflow-y-auto"
          >
            {userChats.map((chat) => {
              const members = membersByChat.get(chat.id) ?? []
              const title =
                chat.kind === "group"
                  ? chat.name || "Untitled group"
                  : members[0]?.name || "Bot conversation"

              return (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  aria-current={activeChatId === chat.id ? "page" : undefined}
                  className={`flex min-w-52 items-center gap-2.5 rounded-xl px-2.5 py-2 transition md:min-w-0 ${
                    activeChatId === chat.id
                      ? "bg-[#FFF2EC] text-[#B94719]"
                      : "hover:bg-[#F7F7F7]"
                  }`}
                >
                  {chat.kind === "group" ? (
                    <GroupAvatar bots={members} />
                  ) : members[0] ? (
                    <PaperAvatar
                      seed={members[0].avatar}
                      alt={members[0].name}
                      className="size-9 rounded-lg"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F7]">
                      <BotIcon className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#737373]">
                      {chat.lastMessagePreview ||
                        (chat.kind === "group"
                          ? `${members.length} participating bots`
                          : "Start a conversation")}
                    </span>
                  </span>
                </Link>
              )
            })}
            {userChats.length === 0 && (
              <p className="px-1 py-2 text-xs text-[#737373]">
                Your conversations will appear here.
              </p>
            )}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:h-full md:min-h-0 md:overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
