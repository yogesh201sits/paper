
"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq, inArray } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  groupChatInsertSchema,
} from "@/db/schema"

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
