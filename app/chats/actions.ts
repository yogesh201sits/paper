
"use server"

import { auth } from "@clerk/nextjs/server"
import { and, desc, eq, inArray, lt } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  groupChatInsertSchema, messages
} from "@/db/schema"
import { tasks } from "@trigger.dev/sdk"
import type { chatResponseTask } from "@/trigger/chat"

export async function createDirectChat(formData: FormData) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const botId = formData.get("botId")
  if (typeof botId !== "string" || !botId) {
    throw new Error("Select a valid bot.")
  }

  const [bot] = await db
    .select({ id: bots.id })
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
    .limit(1)

  if (!bot) throw new Error("Bot not found.")

  // Reuse the existing direct chat with this bot, if one exists.
  const [existing] = await db
    .select({ id: chats.id })
    .from(chats)
    .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
    .where(
      and(
        eq(chats.userId, userId),
        eq(chats.kind, "direct"),
        eq(chatMembers.botId, botId)
      )
    )
    .limit(1)

  if (existing) redirect(`/chats/${existing.id}`)

  const [chat] = await db
    .insert(chats)
    .values({ userId, kind: "direct" })
    .returning({ id: chats.id })

  await db.insert(chatMembers).values({
    chatId: chat.id,
    botId,
  })

  redirect(`/chats/${chat.id}`)
}

export async function createGroupChat(formData: FormData) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const parsed = groupChatInsertSchema.safeParse({
    name: formData.get("name"),
    botIds: formData.getAll("botIds"),
  })

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid group details."
    )
  }

  const { name, botIds } = parsed.data

  // Every selected bot must belong to the current user.
  const ownedBots = await db
    .select({ id: bots.id })
    .from(bots)
    .where(and(eq(bots.userId, userId), inArray(bots.id, botIds)))

  if (
    ownedBots.length !== botIds.length ||
    new Set(botIds).size !== botIds.length
  ) {
    throw new Error("One or more selected bots are invalid.")
  }

  const [chat] = await db
    .insert(chats)
    .values({ userId, kind: "group", name })
    .returning({ id: chats.id })

  await db.insert(chatMembers).values(
    botIds.map((botId) => ({ chatId: chat.id, botId }))
  )

  redirect(`/chats/${chat.id}`)
}


export async function sendMessage(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("You must be signed in to send a message.")
  }

  const chatId = String(formData.get("chatId") ?? "").trim()
  const content = String(formData.get("content") ?? "").trim()
  const botId = String(formData.get("botId") ?? "").trim()

  if (!chatId || !content || !botId) {
    throw new Error("Chat, bot, and message are required.")
  }

  if (content.length > 20_000) {
    throw new Error("Messages must be 20,000 characters or fewer.")
  }

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) {
    throw new Error("Chat not found.")
  }

  const [selectedBot] = await db
    .select({ id: bots.id })
    .from(chatMembers)
    .innerJoin(bots, eq(chatMembers.botId, bots.id))
    .where(
      and(
        eq(chatMembers.chatId, chatId),
        eq(bots.id, botId),
        eq(bots.userId, userId),
      ),
    )
    .limit(1)

  if (!selectedBot) {
    throw new Error("Select a bot that participates in this chat.")
  }

  const [userMessage] = await db
    .insert(messages)
    .values({
      chatId,
      role: "user",
      content,
      status: "completed",
    })
    .returning({ id: messages.id })

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      chatId,
      role: "assistant",
      content: "",
      status: "queued",
      botId: selectedBot.id,
    })
    .returning({ id: messages.id })

  await db
    .update(chats)
    .set({
      lastMessagePreview: content.slice(0, 200),
      lastMessageAt: new Date(),
    })
    .where(eq(chats.id, chatId))

  try {
    const handle = await tasks.trigger<typeof chatResponseTask>(
      "paper-chat-response",
      {
        userId,
        chatId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      },
    )

    await db
      .update(messages)
      .set({ taskId: handle.id })
      .where(eq(messages.id, assistantMessage.id))
  } catch (error) {
    await db
      .update(messages)
      .set({ status: "failed" })
      .where(eq(messages.id, assistantMessage.id))

    throw error
  }

  redirect(`/chats/${chatId}`)
}

export async function retryAssistantResponse(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("You must be signed in.")
  }

  const chatId = String(formData.get("chatId") ?? "").trim()
  const assistantMessageId = String(
    formData.get("assistantMessageId") ?? "",
  ).trim()

  if (!chatId || !assistantMessageId) {
    throw new Error("Chat and message are required.")
  }

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) {
    throw new Error("Chat not found.")
  }

  const [assistantMessage] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, assistantMessageId),
        eq(messages.chatId, chatId),
        eq(messages.role, "assistant"),
        eq(messages.status, "failed"),
      ),
    )
    .limit(1)

  if (!assistantMessage) {
    throw new Error("This response cannot be retried.")
  }

  const [userMessage] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.role, "user"),
        lt(messages.createdAt, assistantMessage.createdAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1)

  if (!userMessage) {
    throw new Error("Original user message not found.")
  }

  await db
    .update(messages)
    .set({ status: "queued", content: "" })
    .where(eq(messages.id, assistantMessageId))

  try {
    const handle = await tasks.trigger<typeof chatResponseTask>(
      "paper-chat-response",
      {
        userId,
        chatId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      },
    )

    await db
      .update(messages)
      .set({ taskId: handle.id })
      .where(eq(messages.id, assistantMessageId))
  } catch (error) {
    await db
      .update(messages)
      .set({ status: "failed" })
      .where(eq(messages.id, assistantMessageId))

    throw error
  }
}
