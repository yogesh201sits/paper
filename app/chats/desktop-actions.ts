"use server"

import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { chats } from "@/db/schema"
import {
  getConfiguredSharedSandboxId,
  getSharedSandboxDesktopUrl,
} from "@/lib/daytona"

export async function getDesktopUrl(chatId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")

  const normalizedChatId = chatId.trim()
  if (!normalizedChatId) throw new Error("A valid chat is required.")

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, normalizedChatId), eq(chats.userId, userId)))
    .limit(1)

  if (!chat) throw new Error("Chat not found.")
  if (!process.env.DAYTONA_API_KEY) {
    throw new Error("DAYTONA_API_KEY is not configured.")
  }

  return getSharedSandboxDesktopUrl(getConfiguredSharedSandboxId())
}
