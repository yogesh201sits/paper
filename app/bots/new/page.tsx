
import Link from "next/link"
import { ArrowLeft, Bot, Sparkles } from "lucide-react"
import { PaperAvatar } from "@/components/paper-avatar"
import { createBot } from "../actions"

const inputClass =
  "w-full rounded-xl border border-[#E7E7E7] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition placeholder:text-[#737373] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/15"

export default function NewBotPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      <header className="flex h-16 items-center border-b border-[#E7E7E7] bg-white px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#FF6A2A] text-white">
            <Bot className="size-5" />
          </span>
          PAPER
        </Link>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#737373] transition hover:text-[#111111]"
        >
          <ArrowLeft className="size-4" />
          Back to workspace
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#FFF2EC]">
            <Sparkles className="size-6 text-[#FF6A2A]" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Create a new bot
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#737373]">
            Give your AI a purpose, define its behavior, and make it yours.
          </p>
        </div>

        <form
          action={createBot}
          className="space-y-6 rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-4 rounded-xl bg-[#F7F7F7] p-4">
            <PaperAvatar seed="Felix" className="size-16" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Your bot's identity</p>
              <p className="mt-1 text-xs leading-5 text-[#737373]">
                Choose a unique avatar seed. You can customize it later.
              </p>
            </div>
            <input
              name="avatar"
              defaultValue="Felix"
              required
              aria-label="Avatar seed"
              className="w-28 rounded-lg border border-[#E7E7E7] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6A2A]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Bot name
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={50}
              placeholder="e.g. Research Assistant"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="job" className="text-sm font-medium">
              What is this bot's role?
            </label>
            <input
              id="job"
              name="job"
              required
              maxLength={100}
              placeholder="e.g. Research, analyze, and summarize information"
              className={inputClass}
            />
            <p className="text-xs text-[#737373]">
              Describe its main responsibility in one sentence.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium">
              Instructions <span className="text-[#737373]">(optional)</span>
            </label>
            <textarea
              id="instructions"
              name="instructions"
              maxLength={4000}
              rows={5}
              placeholder="How should this bot think, communicate, and approach its work?"
              className={`${inputClass} resize-y`}
            />
            <p className="text-xs text-[#737373]">
              Add behavior rules, expertise, preferred formats, or constraints.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E7E7E7] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-[#E7E7E7] px-5 py-3 text-sm font-medium transition hover:bg-[#F7F7F7]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ed5920] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A2A] focus-visible:ring-offset-2"
            >
              <Sparkles className="size-4" />
              Create bot
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
