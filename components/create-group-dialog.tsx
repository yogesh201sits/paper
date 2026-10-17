"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { LoaderCircle, Users } from "lucide-react"

import { createGroupChat } from "@/app/chats/actions"
import { PaperAvatar } from "@/components/paper-avatar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type GroupBot = {
  id: string
  name: string
  job: string
  avatar: string
}

function CreateGroupButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || selectedCount < 2}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6A2A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E95A1D] focus-visible:ring-2 focus-visible:ring-[#FF6A2A]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Users className="size-4" />
      )}
      {pending ? "Creating group…" : "Create group"}
    </button>
  )
}

export function CreateGroupDialog({
  bots,
  triggerClassName,
  compact = false,
}: {
  bots: GroupBot[]
  triggerClassName?: string
  compact?: boolean
}) {
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([])

  return (
    <Dialog>
      <DialogTrigger
        className={
          triggerClassName ??
          "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7E7E7] px-4 py-2.5 text-sm font-medium transition hover:border-[#FF6A2A] hover:bg-[#FFF9F6]"
        }
      >
        <Users className="size-4 text-[#FF6A2A]" />
        {compact ? "New group" : "Create a group"}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto p-0">
        <form action={createGroupChat} className="space-y-5 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Create a group chat
            </DialogTitle>
            <DialogDescription>
              Choose at least two bots to work together in one conversation.
            </DialogDescription>
          </DialogHeader>

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
              className="w-full rounded-xl border border-[#E7E7E7] bg-white px-3 py-2.5 text-sm transition outline-none focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              Choose bots
              <span className="ml-2 font-normal text-[#737373]">
                {selectedBotIds.length} selected
              </span>
            </legend>
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {bots.map((bot) => {
                const checked = selectedBotIds.includes(bot.id)
                return (
                  <label
                    key={bot.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-[#FF6A2A] bg-[#FFF9F6]"
                        : "border-[#E7E7E7] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="botIds"
                      value={bot.id}
                      checked={checked}
                      onChange={(event) => {
                        setSelectedBotIds((current) =>
                          event.target.checked
                            ? [...current, bot.id]
                            : current.filter((id) => id !== bot.id)
                        )
                      }}
                      className="size-4 accent-[#FF6A2A]"
                    />
                    <PaperAvatar
                      seed={bot.avatar}
                      alt={bot.name}
                      className="size-10 rounded-full"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {bot.name}
                      </span>
                      <span className="block truncate text-xs text-[#737373]">
                        {bot.job}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {bots.length < 2 && (
            <p className="text-sm text-[#737373]">
              Create at least two bots before starting a group chat.
            </p>
          )}

          <DialogFooter>
            <DialogClose className="rounded-xl border border-[#E7E7E7] px-4 py-2.5 text-sm font-medium transition hover:bg-[#F7F7F7]">
              Cancel
            </DialogClose>
            <CreateGroupButton selectedCount={selectedBotIds.length} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
