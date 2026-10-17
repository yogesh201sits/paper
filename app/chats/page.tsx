
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq, inArray } from "drizzle-orm"
import {
  ArrowUpRight,
  Bot as BotIcon,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react"
import { redirect } from "next/navigation"

import { PaperAvatar } from "@/components/paper-avatar"
import { db } from "@/db"
import { bots, chatMembers, chats } from "@/db/schema"
import { createDirectChat, createGroupChat } from "./actions"

export const dynamic = "force-dynamic"

export default async function ChatsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const [userBots, userChats] = await Promise.all([
    db.select().from(bots)
      .where(eq(bots.userId, userId))
      .orderBy(desc(bots.createdAt)),

    db.select().from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.lastMessageAt)),
  ])

  const memberships = userChats.length
    ? await db
        .select({
          chatId: chatMembers.chatId,
          botId: bots.id,
          botName: bots.name,
          avatar: bots.avatar,
          job: bots.job,
        })
        .from(chatMembers)
        .innerJoin(bots, eq(chatMembers.botId, bots.id))
        .where(inArray(chatMembers.chatId, userChats.map((chat) => chat.id)))
    : []

  const membersByChat = new Map<
    string,
    typeof memberships
  >()

  for (const member of memberships) {
    const current = membersByChat.get(member.chatId) ?? []
    current.push(member)
    membersByChat.set(member.chatId, current)
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      <header className="sticky top-0 z-10 border-b border-[#E7E7E7] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/chats" className="text-xl font-bold tracking-tight">
            paper<span className="text-[#FF6A2A]">.</span>
          </Link>

          <Link
            href="/bots"
            className="rounded-lg border border-[#E7E7E7] px-3 py-2 text-sm font-medium transition hover:bg-[#FFF2EC]"
          >
            My bots
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-6">
          <div>
            <p className="text-sm font-medium text-[#FF6A2A]">
              WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Your conversations
            </h1>
            <p className="mt-2 text-sm text-[#737373]">
              Talk to a bot directly or bring multiple agents into one chat.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E7E7E7] bg-white">
            <div className="flex items-center justify-between border-b border-[#E7E7E7] px-5 py-4">
              <h2 className="font-semibold">Recent chats</h2>
              <span className="text-xs text-[#737373]">
                {userChats.length} conversations
              </span>
            </div>

            {userChats.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFF2EC]">
                  <MessageSquare className="size-5 text-[#FF6A2A]" />
                </div>
                <h3 className="mt-4 font-semibold">No conversations yet</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-[#737373]">
                  Start a conversation with one bot, or create a group to
                  bring your agents together.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E7E7E7]">
                {userChats.map((chat) => {
                  const members = membersByChat.get(chat.id) ?? []
                  const title =
                    chat.kind === "group"
                      ? chat.name || "Untitled group"
                      : members[0]?.botName || "Bot conversation"

                  const subtitle =
                    chat.kind === "group"
                      ? `${members.length} agents`
                      : members[0]?.job || "Direct conversation"

                  return (
                    <Link
                      key={chat.id}
                      href={`/chats/${chat.id}`}
                      className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#FFF9F6]"
                    >
                      {chat.kind === "group" ? (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EC]">
                          <Users className="size-5 text-[#FF6A2A]" />
                        </div>
                      ) : members[0] ? (
                        <PaperAvatar
                          seed={members[0].avatar}
                          alt={members[0].botName}
                          className="size-11 rounded-xl"
                        />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#F7F7F7]">
                          <BotIcon className="size-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {title}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#737373]">
                          {chat.lastMessagePreview || subtitle}
                        </p>
                      </div>

                      <ArrowUpRight className="size-4 shrink-0 text-[#737373]" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF2EC]">
                <Plus className="size-5 text-[#FF6A2A]" />
              </div>
              <div>
                <h2 className="font-semibold">Start a direct chat</h2>
                <p className="mt-1 text-xs text-[#737373]">
                  Choose one of your bots
                </p>
              </div>
            </div>

            {userBots.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-[#E7E7E7] p-4 text-sm text-[#737373]">
                Create a bot before starting a conversation.
                <Link
                  href="/bots/new"
                  className="mt-3 inline-flex font-medium text-[#FF6A2A] hover:underline"
                >
                  Create your first bot
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {userBots.map((bot) => (
                  <form key={bot.id} action={createDirectChat}>
                    <input type="hidden" name="botId" value={bot.id} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl border border-[#E7E7E7] p-3 text-left transition hover:border-[#FF6A2A] hover:bg-[#FFF9F6]"
                    >
                      <PaperAvatar
                        seed={bot.avatar}
                        alt={bot.name}
                        className="size-10 rounded-lg"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {bot.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[#737373]">
                          {bot.job}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-[#737373]" />
                    </button>
                  </form>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#111111]">
                <Users className="size-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Create a group</h2>
                <p className="mt-1 text-xs text-[#737373]">
                  Bring multiple bots together
                </p>
              </div>
            </div>

            {userBots.length < 2 ? (
              <p className="mt-4 text-sm leading-6 text-[#737373]">
                You need at least two bots to create a group conversation.
              </p>
            ) : (
              <form action={createGroupChat} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="group-name" className="text-sm font-medium">
                    Group name
                  </label>
                  <input
                    id="group-name"
                    name="name"
                    required
                    minLength={1}
                    maxLength={50}
                    placeholder="e.g. Product team"
                    className="w-full rounded-xl border border-[#E7E7E7] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10"
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="mb-2 text-sm font-medium">
                    Select agents
                  </legend>
                  {userBots.map((bot) => (
                    <label
                      key={bot.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E7E7E7] p-3 transition hover:bg-[#FFF9F6]"
                    >
                      <input
                        type="checkbox"
                        name="botIds"
                        value={bot.id}
                        className="size-4 accent-[#FF6A2A]"
                      />
                      <PaperAvatar
                        seed={bot.avatar}
                        alt={bot.name}
                        className="size-9 rounded-lg"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {bot.name}
                        </span>
                        <span className="block truncate text-xs text-[#737373]">
                          {bot.job}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#FF6A2A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E95A1D] focus:outline-none focus:ring-2 focus:ring-[#FF6A2A]/30 focus:ring-offset-2"
                >
                  Create group chat
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}
