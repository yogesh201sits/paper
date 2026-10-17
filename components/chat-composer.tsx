
"use client"

import { useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowUp } from "lucide-react"

import { sendMessage } from "@/app/chats/actions"
import { PaperAvatar } from "@/components/paper-avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

type ChatBot = {
  id: string
  name: string
  job: string
  avatar: string
}

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <InputGroupButton
      type="submit"
      size="icon-sm"
      variant="default"
      className="ml-auto rounded-full bg-[#FF6A2A] text-white hover:bg-[#E85A20]"
      disabled={pending || disabled}
      aria-label="Send message"
    >
      <ArrowUp className="size-4" />
    </InputGroupButton>
  )
}

export function ChatComposer({
  chatId,
  bots,
  defaultBotId,
}: {
  chatId: string
  bots: ChatBot[]
  defaultBotId?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedBotId, setSelectedBotId] = useState(
    defaultBotId && bots.some((bot) => bot.id === defaultBotId)
      ? defaultBotId
      : (bots[0]?.id ?? ""),
  )
  const selectedBot = bots.find((bot) => bot.id === selectedBotId)

  return (
    <form
      ref={formRef}
      action={sendMessage}
      className="mx-auto w-full max-w-4xl"
    >
      <input type="hidden" name="chatId" value={chatId} />

      <InputGroup className="rounded-2xl border-[#E7E7E7] bg-white focus-within:border-[#FF6A2A]">
        <InputGroupAddon
          align="block-start"
          className="justify-start gap-2.5 border-b border-[#F2F2F2] px-3 py-2"
        >
          {selectedBot ? (
            <PaperAvatar
              seed={selectedBot.avatar}
              alt={selectedBot.name}
              size={28}
              className="size-7"
            />
          ) : (
            <span className="size-7 shrink-0 rounded-full bg-[#E7E7E7]" />
          )}
          <label
            htmlFor="chat-bot"
            className="shrink-0 text-xs font-medium text-[#737373]"
          >
            Replying as
          </label>
          <select
            id="chat-bot"
            name="botId"
            value={selectedBotId}
            onChange={(event) => setSelectedBotId(event.target.value)}
            disabled={bots.length === 0}
            required
            className="min-w-0 max-w-[45%] rounded-md bg-transparent py-1 text-sm font-semibold text-[#111111] outline-none transition focus-visible:ring-2 focus-visible:ring-[#FF6A2A]/30 disabled:text-[#737373]"
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
            {bots.length === 0 && <option value="">No available bots</option>}
          </select>
          {selectedBot && (
            <span className="min-w-0 truncate text-xs text-[#737373]">
              · {selectedBot.job}
            </span>
          )}
        </InputGroupAddon>

        <InputGroupTextarea
          name="content"
          placeholder={
            selectedBot ? `Message ${selectedBot.name}...` : "No bots available"
          }
          required
          disabled={bots.length === 0}
          maxLength={20_000}
          rows={1}
          className="min-h-12 max-h-40 p-3"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
        />

        <InputGroupAddon align="block-end">
          <span className="px-2 text-xs text-muted-foreground">
            Enter to send · Shift+Enter for newline
          </span>
          <SendButton disabled={bots.length === 0} />
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
