import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Plus,
  Users,
  Zap,
} from "lucide-react"
import { redirect } from "next/navigation"

import { CreateGroupDialog } from "@/components/create-group-dialog"
import { PaperAvatar } from "@/components/paper-avatar"
import { db } from "@/db"
import { bots } from "@/db/schema"
import { createDirectChat } from "./actions"

export const dynamic = "force-dynamic"

export default async function ChatsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const userBots = await db
    .select({
      id: bots.id,
      name: bots.name,
      job: bots.job,
      avatar: bots.avatar,
    })
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(desc(bots.createdAt))

  const showcaseBots = userBots.slice(0, 5)

  return (
    <main className="min-h-full bg-[#FAFAF8] text-[#20201E]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#E7E6E1] bg-[#FAFAF8]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/chats"
            aria-label="PAPER home"
            className="text-[21px] font-semibold tracking-[-0.09em]"
          >
            paper<span className="font-normal">.</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/bots"
              className="rounded-lg px-3 py-2 text-sm text-[#656560] transition-colors hover:bg-[#F0F0EC] hover:text-[#20201E]"
            >
              My agents
            </Link>

            <Link
              href="/bots/new"
              className="inline-flex items-center gap-2 rounded-lg border border-[#242421] bg-[#242421] px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3B3B37]"
            >
              <Plus className="size-4" strokeWidth={1.7} />
              <span className="hidden sm:inline">New agent</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        {/* Introduction */}
        <section className="relative overflow-hidden border-b border-[#E7E6E1] py-10 sm:py-14">
          <div className="pointer-events-none absolute right-0 top-5 hidden size-40 items-center justify-center sm:flex">
            <div className="absolute size-36 rounded-full border border-[#E6E5DF]" />
            <div className="absolute size-24 rounded-full border border-[#E6E5DF]" />
            <div className="absolute size-12 rotate-45 border border-[#D9D8D1]" />
            <div className="absolute size-2 rounded-full bg-[#8A8A80]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#77776F]">
                <span className="size-1.5 rounded-full bg-[#73736A]" />
                Your workspace
              </div>

              <h1 className="max-w-xl text-[34px] font-medium leading-[1.1] tracking-[-0.055em] sm:text-5xl">
                Good work starts
                <br className="hidden sm:block" /> with the right minds.
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-[#77776F] sm:text-[15px]">
                Choose an agent to work through an idea, or bring a few
                together to solve something bigger.
              </p>
            </div>

            <div className="flex items-center gap-3 border-t border-[#E7E6E1] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <div className="flex size-10 items-center justify-center rounded-xl border border-[#E3E2DC] bg-white">
                <Bot className="size-[19px] text-[#42423D]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-medium leading-6 tracking-tight">
                  {String(userBots.length).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs text-[#77776F]">
                  {userBots.length === 1 ? "Agent available" : "Agents available"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Agents */}
        <section className="pt-9">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#88887F]">
                01 / Your team
              </div>
              <h2 className="mt-2 text-lg font-medium tracking-tight">
                Meet your agents
              </h2>
              <p className="mt-1 text-sm text-[#77776F]">
                Different skills. One workspace.
              </p>
            </div>

            {userBots.length > 5 && (
              <Link
                href="/bots"
                className="inline-flex items-center gap-1.5 pb-1 text-sm text-[#55554F] transition-colors hover:text-black"
              >
                All agents
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </Link>
            )}
          </div>

          {userBots.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-[#D9D8D1] bg-white px-6 py-14 text-center sm:py-16">
              <div className="relative flex size-16 items-center justify-center rounded-[22px] border border-[#E5E4DE] bg-[#F8F8F5]">
                <Bot className="size-7 text-[#484842]" strokeWidth={1.25} />
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#B8B8AC]" />
              </div>

              <h3 className="mt-5 text-base font-medium tracking-tight">
                Start with one good idea.
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#77776F]">
                Give your first agent a role, a purpose, and the instructions
                it needs to get to work.
              </p>

              <Link
                href="/bots/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#242421] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3B3B37]"
              >
                <Plus className="size-4" strokeWidth={1.7} />
                Create your first agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {showcaseBots.map((bot, index) => (
                <form
                  key={bot.id}
                  action={createDirectChat}
                  className="min-w-0"
                >
                  <input type="hidden" name="botId" value={bot.id} />

                  <button
                    type="submit"
                    title={`Start a chat with ${bot.name}`}
                    className="group relative flex min-h-[206px] w-full flex-col items-start overflow-hidden border border-[#E4E3DD] bg-white p-4 text-left transition-colors duration-200 hover:border-[#A5A59A] hover:bg-[#FDFDFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#77776F] focus-visible:ring-offset-2 sm:p-5"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <PaperAvatar
                        seed={bot.avatar}
                        alt={bot.name}
                        className="size-14 shrink-0 sm:size-16"
                      />

                      <span className="flex size-7 items-center justify-center border border-[#EBEAE5] text-[#77776F] transition-colors group-hover:border-[#C9C8BF] group-hover:text-[#20201E]">
                        <ArrowUpRight
                          className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          strokeWidth={1.5}
                        />
                      </span>
                    </div>

                    <div className="mt-6 w-full">
                      <h3 className="truncate text-sm font-medium tracking-tight">
                        {bot.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-[17px] text-[#77776F]">
                        {bot.job || "General assistant"}
                      </p>
                    </div>

                    <div className="mt-auto flex w-full items-center justify-between border-t border-[#EEEDE8] pt-3">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#88887F]">
                        Agent {String(index + 1).padStart(2, "0")}
                      </span>
                      <MessageSquare
                        className="size-3.5 text-[#77776F] transition-colors group-hover:text-[#20201E]"
                        strokeWidth={1.5}
                      />
                    </div>
                  </button>
                </form>
              ))}

              {userBots.length < 5 && (
                <Link
                  href="/bots/new"
                  className="group flex min-h-[206px] flex-col items-center justify-center border border-dashed border-[#D7D6CF] bg-transparent p-4 text-center transition-colors hover:border-[#A5A59A] hover:bg-white sm:p-5"
                >
                  <span className="flex size-11 items-center justify-center border border-[#E1E0D9] bg-white transition-colors group-hover:border-[#B9B8AF]">
                    <Plus
                      className="size-5 text-[#77776F]"
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className="mt-4 text-sm font-medium">
                    Add an agent
                  </span>
                  <span className="mt-1 text-xs text-[#88887F]">
                    Define a new role
                  </span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Collaboration */}
        <section className="mt-12">
          <div className="mb-5">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#88887F]">
              02 / Collaboration
            </div>
            <h2 className="mt-2 text-lg font-medium tracking-tight">
              Better work, together.
            </h2>
            <p className="mt-1 text-sm text-[#77776F]">
              Give different agents a seat at the same table.
            </p>
          </div>

          <div className="grid overflow-hidden border border-[#E4E3DD] bg-white md:grid-cols-[1fr_260px]">
            <div className="flex flex-col justify-center p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center border border-[#E4E3DD] bg-[#F8F8F5]">
                  <Users
                    className="size-5 text-[#484842]"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-medium tracking-tight">
                    Bring the team together
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#77776F]">
                    Create a shared conversation where agents can exchange
                    perspectives, split up work, and help move a problem
                    forward.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#77776F]">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="size-3.5" strokeWidth={1.5} />
                      Multiple agents
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="size-3.5" strokeWidth={1.5} />
                      One shared chat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-5 border-t border-[#E4E3DD] bg-[#F6F6F2] p-5 sm:p-6 md:border-l md:border-t-0">
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#88887F]">
                  <span>Team workspace</span>
                  <span>01</span>
                </div>

                <div className="mt-5 flex items-center -space-x-2">
                  {showcaseBots.slice(0, 4).map((bot) => (
                    <div
                      key={bot.id}
                      title={bot.name}
                      className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#F6F6F2] bg-white"
                    >
                      <PaperAvatar
                        seed={bot.avatar}
                        alt={bot.name}
                        className="size-full"
                      />
                    </div>
                  ))}

                  {userBots.length > 4 && (
                    <span className="flex size-9 items-center justify-center rounded-full border-2 border-[#F6F6F2] bg-[#E7E6DF] text-[10px] font-medium">
                      +{userBots.length - 4}
                    </span>
                  )}

                  {userBots.length === 0 && (
                    <span className="flex size-9 items-center justify-center rounded-full border border-[#DFDED7] bg-white">
                      <Bot className="size-4 text-[#77776F]" />
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-[#77776F]">
                  {userBots.length === 0
                    ? "Create agents before building your team."
                    : `${userBots.length} ${userBots.length === 1 ? "agent is" : "agents are"} ready to collaborate.`}
                </p>
              </div>

              <CreateGroupDialog
                bots={userBots}
                compact
                triggerClassName="inline-flex w-full items-center justify-center gap-2 border border-[#242421] bg-[#242421] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3B3B37] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 flex flex-col gap-3 border-t border-[#E4E3DD] pt-5 text-xs text-[#88887F] sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium tracking-tight text-[#343430]">
              paper.
            </span>{" "}
            A workspace for thinking together.
          </p>

          <Link
            href="/bots"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#20201E]"
          >
            Manage your agents
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </footer>
      </div>
    </main>
  )
}