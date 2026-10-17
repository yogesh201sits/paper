
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { ArrowLeft, Bot as BotIcon, Users } from "lucide-react"
import { notFound, redirect } from "next/navigation"

import { PaperAvatar } from "@/components/paper-avatar"
import { db } from "@/db"
import { bots, chatMembers, chats } from "@/db/schema"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const { id } = await params

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) notFound()

  const members = await db
    .select({
      id: bots.id,
      name: bots.name,
      avatar: bots.avatar,
      job: bots.job,
    })
    .from(chatMembers)
    .innerJoin(bots, eq(chatMembers.botId, bots.id))
    .where(eq(chatMembers.chatId, chat.id))

  const title =
    chat.kind === "group"
      ? chat.name || "Untitled group"
      : members[0]?.name || "Bot conversation"

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F7F7] text-[#111111]">
      <header className="border-b border-[#E7E7E7] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="rounded-lg border border-[#E7E7E7] p-2 transition hover:bg-[#FFF2EC]"
          >
            <ArrowLeft className="size-4" />
          </Link>

          {chat.kind === "group" ? (
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF2EC]">
              <Users className="size-5 text-[#FF6A2A]" />
            </div>
          ) : members[0] ? (
            <PaperAvatar
              seed={members[0].avatar}
              alt={members[0].name}
              className="size-10 rounded-xl"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#F7F7F7]">
              <BotIcon className="size-5" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate font-semibold">{title}</h1>
            <p className="text-xs text-[#737373]">
              {members.length} {members.length === 1 ? "agent" : "agents"}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 sm:px-8">
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FFF2EC]">
            <BotIcon className="size-6 text-[#FF6A2A]" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Start working with {title}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-[#737373]">
            Your conversation workspace is ready. Message history, agent
            responses, and background execution will be connected next.
          </p>

          {members.length > 0 && (
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-xl border border-[#E7E7E7] bg-white px-3 py-2"
                >
                  <PaperAvatar
                    seed={member.avatar}
                    alt={member.name}
                    className="size-8 rounded-lg"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="max-w-40 truncate text-xs text-[#737373]">
                      {member.job}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/bots"
            className="mt-8 rounded-xl bg-[#FF6A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E95A1D]"
          >
            Manage bots
          </Link>
        </div>
      </section>
    </main>
  )
}
