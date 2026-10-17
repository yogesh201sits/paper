import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import {
  ArrowLeft,
  Box,
  Cpu,
  ExternalLink,
  HardDrive,
  MemoryStick,
  Monitor,
  Terminal,
} from "lucide-react"
import { redirect } from "next/navigation"

import { SandboxLiveView } from "@/components/sandbox-live-view"
import { SandboxControls } from "@/components/sandbox-controls"
import { getConfiguredSharedSandboxId, getDaytona } from "@/lib/daytona"

export const dynamic = "force-dynamic"

export default async function SandboxPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const sandboxId = getConfiguredSharedSandboxId()
  const configured = Boolean(process.env.DAYTONA_API_KEY)
  let sandbox: {
    id: string
    name: string
    state: string
    cpu: number
    memory: number
    disk: number
  } | null = null
  let connectionError: string | null = null

  if (configured) {
    try {
      const instance = await getDaytona().get(sandboxId)
      sandbox = {
        id: instance.id,
        name: instance.name,
        state: String(instance.state),
        cpu: instance.cpu,
        memory: instance.memory,
        disk: instance.disk,
      }
    } catch (error) {
      connectionError =
        error instanceof Error
          ? error.message
          : "Could not retrieve the shared Daytona sandbox."
    }
  }

  const running = sandbox?.state === "started"
  const metrics = [
    { label: "CPU", value: sandbox ? `${sandbox.cpu} cores` : "—", icon: Cpu },
    {
      label: "Memory",
      value: sandbox ? `${sandbox.memory} GB` : "—",
      icon: MemoryStick,
    },
    {
      label: "Disk",
      value: sandbox ? `${sandbox.disk} GB` : "—",
      icon: HardDrive,
    },
  ]

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#171717]">
      <header className="sticky top-0 z-20 border-b border-[#E7E7E7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/chats" className="text-xl font-bold tracking-tight">
            paper<span className="text-[#FF6A2A]">.</span>
          </Link>
          <Link
            href="/chats"
            className="inline-flex items-center gap-2 text-sm text-[#737373] transition hover:text-[#171717]"
          >
            <ArrowLeft className="size-4" />
            Back to chats
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-[#737373]">
              <Terminal className="size-4" />
              Runtime environment
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Daytona sandbox
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#737373]">
              One shared execution environment for PAPER bots. Agents can run
              commands, work with files, and control the desktop here.
            </p>
          </div>
          <a
            href="https://app.daytona.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E7E7E7] bg-white px-4 py-2.5 text-sm font-medium transition hover:border-[#FF6A2A]"
          >
            Daytona dashboard
            <ExternalLink className="size-4" />
          </a>
        </div>

        {!configured && (
          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold">Daytona is not configured</h2>
            <p className="mt-2 text-sm leading-6 text-[#737373]">
              Add <code className="font-mono">DAYTONA_API_KEY</code> to the
              server environment to connect agents to the shared sandbox
              <code className="ml-1 font-mono">{sandboxId}</code>.
            </p>
          </section>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] xl:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white bg-[#F7F7F7] p-5 shadow-[5px_5px_12px_#dedede,-5px_-5px_12px_#ffffff] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF2EC] text-[#FF6A2A]">
                    <Box className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {sandbox?.name || "PAPER shared runtime"}
                    </h2>
                    <p className="mt-1 truncate text-sm text-[#737373]">
                      {sandbox
                        ? `Sandbox ID: ${sandbox.id}`
                        : `Sandbox ID: ${sandboxId}`}
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#404040]">
                  <span
                    className={`size-2 rounded-full ${
                      running
                        ? "bg-emerald-500"
                        : connectionError
                          ? "bg-red-500"
                          : "bg-[#A3A3A3]"
                    }`}
                  />
                  {running
                    ? "Running"
                    : connectionError
                      ? "Connection failed"
                      : sandbox
                        ? sandbox.state
                        : "Unavailable"}
                </span>
              </div>

              {connectionError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                >
                  Could not retrieve the shared Daytona sandbox:{" "}
                  {connectionError}
                </p>
              )}

              <div className="mt-6 border-t border-[#E7E7E7] pt-5">
                <SandboxControls
                  ready={running}
                  hasSandbox={true}
                  configured={configured}
                />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-white bg-[#F7F7F7] p-5 shadow-[4px_4px_10px_#dedede,-4px_-4px_10px_#ffffff]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#737373]">
                        {metric.label}
                      </span>
                      <Icon className="size-4 text-[#555555]" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                  </article>
                )
              })}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
                <Terminal className="size-5 text-[#FF6A2A]" />
                <h2 className="mt-4 font-semibold">Execution tools</h2>
                <p className="mt-2 text-sm leading-6 text-[#737373]">
                  Every participating agent can run shell commands and inspect
                  or change files in this shared environment.
                </p>
              </article>
              <article className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
                <Monitor className="size-5 text-[#FF6A2A]" />
                <h2 className="mt-4 font-semibold">Desktop tools</h2>
                <p className="mt-2 text-sm leading-6 text-[#737373]">
                  Agents can view the desktop, click, type, and verify what
                  changed. Their saved memories remain separate.
                </p>
              </article>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24">
            <SandboxLiveView enabled={configured && running} />
          </aside>
        </div>
      </div>
    </main>
  )
}
