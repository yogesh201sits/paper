
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Plus, Bot, ArrowUpRight } from "lucide-react"

import { db } from "@/db"
import { bots } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { PaperAvatar } from "@/components/paper-avatar"

export default async function BotsPage() {
  const { userId } = await auth()

  if (!userId) redirect("/")

  const userBots = await db
    .select()
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(desc(bots.createdAt))

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      <header className="flex h-16 items-center justify-between border-b border-[#E7E7E7] bg-white px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-[#FF6A2A]">P</span>APER
        </Link>

        <Link
          href="/bots/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6A2A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ed5920]"
        >
          <Plus className="size-4" />
          Create bot
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#FF6A2A]">
            YOUR WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Your bots
          </h1>
          <p className="mt-2 text-sm text-[#737373]">
            Create and manage your personal AI assistants.
          </p>
        </div>

        {userBots.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E7E7E7] bg-white px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FFF2EC]">
              <Bot className="size-7 text-[#FF6A2A]" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">
              Your workspace starts here
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#737373]">
              Create your first bot by defining its role and instructions.
            </p>
            <Link
              href="/bots/new"
              className="mt-6 rounded-xl bg-[#FF6A2A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ed5920]"
            >
              Create your first bot
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userBots.map((bot) => (
              <article
                key={bot.id}
                className="rounded-2xl border border-[#E7E7E7] bg-white p-5 transition hover:border-[#FF6A2A]/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <PaperAvatar seed={bot.avatar} className="size-12" />
                  <span className="rounded-full bg-[#F7F7F7] px-2.5 py-1 text-xs text-[#737373]">
                    Bot
                  </span>
                </div>

                <h2 className="mt-4 truncate font-semibold">{bot.name}</h2>
                <p className="mt-1 line-clamp-3 min-h-[60px] text-sm leading-5 text-[#737373]">
                  {bot.job}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-[#E7E7E7] pt-4 text-xs text-[#737373]">
                  <span>
                    Created{" "}
                    {bot.createdAt.toLocaleDateString()}
                  </span>
                  <ArrowUpRight className="size-4" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
