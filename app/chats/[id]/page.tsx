import { auth } from "@clerk/nextjs/server"
import { and, asc, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { ChatRefresh } from "@/components/chat-refresh"
import { RetryResponseForm } from "@/components/retry-response-form"

import { db } from "@/db"
import { bots, chatMembers, chats, messages } from "@/db/schema"
import { getConfiguredSharedSandboxId, getDaytona } from "@/lib/daytona"
import { PaperAvatar } from "@/components/paper-avatar"
import { ChatComposer } from "@/components/chat-composer"
import {
  DesktopPanelLayout,
  DesktopPanelProvider,
  DesktopPanelToggle,
} from "@/components/desktop"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"

type ChatPageProps = {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const { id } = await params

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) {
    notFound()
  }

  const members = await db
    .select({
      id: bots.id,
      name: bots.name,
      job: bots.job,
      avatar: bots.avatar,
    })
    .from(chatMembers)
    .innerJoin(bots, eq(chatMembers.botId, bots.id))
    .where(eq(chatMembers.chatId, chat.id))

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chat.id))
    .orderBy(asc(messages.createdAt))
  const hasPendingMessages = chatMessages.some(
    (message) =>
      message.role === "assistant" &&
      (message.status === "queued" || message.status === "running")
  )

  const title =
    chat.kind === "group" ? chat.name || "Group chat" : "Conversation"
  const lastSelectedBotId =
    [...chatMessages]
      .reverse()
      .find((message) => message.role === "assistant" && message.botId)
      ?.botId ?? undefined
  let sandboxRunning = false
  let sandboxStatusMessage: string | undefined

  if (process.env.DAYTONA_API_KEY) {
    try {
      const sandbox = await getDaytona().get(getConfiguredSharedSandboxId())
      sandboxRunning = sandbox.state === "started"
      if (!sandboxRunning) {
        sandboxStatusMessage = `Sandbox is ${sandbox.state}. Start it from the sandbox page to view its desktop.`
      }
    } catch (error) {
      sandboxStatusMessage =
        error instanceof Error
          ? `Could not check the sandbox: ${error.message}`
          : "Could not check the sandbox status."
    }
  } else {
    sandboxStatusMessage = "Add DAYTONA_API_KEY to enable the live desktop."
  }

  return (
    <main className="flex h-[calc(100dvh-12rem)] min-h-[24rem] flex-col bg-[#F7F7F7] text-[#111111] md:h-full md:min-h-0">
      <ChatRefresh hasPendingMessages={hasPendingMessages} />
      <DesktopPanelProvider
        chatId={chat.id}
        enabled={sandboxRunning}
        statusMessage={sandboxStatusMessage}
      >
        <header className="flex h-14 shrink-0 items-center border-b border-[#E7E7E7] bg-white px-4 md:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            <p className="flex items-center gap-1.5 text-xs text-[#737373]">
              {hasPendingMessages ? (
                <>
                  <LoaderCircle className="size-3 animate-spin text-[#FF6A2A]" />
                  Assistant is responding
                </>
              ) : chat.kind === "group" ? (
                `${members.length} participating bots · choose one to reply`
              ) : (
                "Choose a bot to reply"
              )}
            </p>
          </div>
          <div className="ml-auto">
            <DesktopPanelToggle />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <DesktopPanelLayout>
            <div className="flex h-full min-h-0 flex-col">
              <section className="min-h-0 min-w-0 flex-1">
                <MessageScrollerProvider autoScroll>
                  <MessageScroller className="h-full">
                    <MessageScrollerViewport>
                      <MessageScrollerContent className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 md:px-8">
                        {chatMessages.length === 0 ? (
                          <div className="flex min-h-[35vh] flex-col items-center justify-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#FFF2EC] text-2xl text-[#FF6A2A]">
                              ✳
                            </div>
                            <h2 className="font-semibold">
                              Start a conversation
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Choose a bot below and send your first message.
                            </p>
                          </div>
                        ) : (
                          chatMessages.map((message) => {
                            const isUser = message.role === "user"
                            const responseBot =
                              members.find((bot) => bot.id === message.botId) ??
                              members[0]
                            const handoffBot = members.find(
                              (bot) => bot.id === message.handoffBotId
                            )

                            return (
                              <MessageScrollerItem
                                key={message.id}
                                messageId={message.id}
                                scrollAnchor={isUser}
                              >
                                <Message
                                  align={isUser ? "end" : "start"}
                                  className="items-end gap-2"
                                >
                                  {isUser ? (
                                    <MessageContent className="w-fit max-w-[min(82%,44rem)] flex-none gap-0">
                                      <div className="w-fit max-w-full rounded-2xl rounded-br-md bg-[#FF6A2A] px-4 py-3 text-sm leading-6 break-words whitespace-pre-wrap text-white shadow-sm">
                                        {message.content}
                                      </div>
                                    </MessageContent>
                                  ) : (
                                    <>
                                      <MessageAvatar className="mb-1 size-9 border-0 bg-transparent">
                                        {responseBot && (
                                          <PaperAvatar
                                            seed={responseBot.avatar}
                                            alt={responseBot.name}
                                            size={36}
                                            className="size-9"
                                          />
                                        )}
                                      </MessageAvatar>
                                      <MessageContent className="max-w-[calc(100%-2.75rem)] flex-1 gap-1">
                                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                          <span className="font-semibold text-[#111111]">
                                            {responseBot?.name || "Assistant"}
                                          </span>
                                          {handoffBot && (
                                            <span className="rounded-full bg-[#FFF2EC] px-2 py-0.5 font-medium text-[#B94719]">
                                              Handed off to {handoffBot.name}
                                            </span>
                                          )}
                                        </div>
                                        {message.content ? (
                                          <p className="text-sm leading-7 break-words whitespace-pre-wrap text-[#262626]">
                                            {message.content}
                                          </p>
                                        ) : message.status === "queued" ||
                                          message.status === "running" ? (
                                          <div
                                            className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
                                            role="status"
                                            aria-live="polite"
                                          >
                                            <span className="flex items-center gap-1">
                                              <span className="size-1.5 animate-bounce rounded-full bg-[#FF6A2A]" />
                                              <span className="size-1.5 animate-bounce rounded-full bg-[#FF6A2A] [animation-delay:120ms]" />
                                              <span className="size-1.5 animate-bounce rounded-full bg-[#FF6A2A] [animation-delay:240ms]" />
                                            </span>
                                            {message.status === "queued"
                                              ? "Waiting for a response"
                                              : "Thinking"}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-destructive">
                                            The response could not be completed.
                                          </p>
                                        )}
                                        {message.status === "running" &&
                                          message.content && (
                                            <span
                                              className="mt-1 flex items-center gap-1.5 text-xs text-[#737373]"
                                              role="status"
                                            >
                                              <LoaderCircle className="size-3 animate-spin text-[#FF6A2A]" />
                                              Writing response…
                                            </span>
                                          )}
                                        {message.status === "failed" && (
                                          <RetryResponseForm
                                            chatId={chat.id}
                                            assistantMessageId={message.id}
                                          />
                                        )}
                                      </MessageContent>
                                    </>
                                  )}
                                </Message>
                              </MessageScrollerItem>
                            )
                          })
                        )}
                      </MessageScrollerContent>
                    </MessageScrollerViewport>

                    <MessageScrollerButton />
                  </MessageScroller>
                </MessageScrollerProvider>
              </section>

              <footer className="shrink-0 bg-[#F7F7F7] p-4 md:px-6">
                <ChatComposer
                  chatId={chat.id}
                  bots={members}
                  defaultBotId={lastSelectedBotId}
                />
              </footer>
            </div>
          </DesktopPanelLayout>
        </div>
      </DesktopPanelProvider>
    </main>
  )
}
