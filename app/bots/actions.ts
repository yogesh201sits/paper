"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { bots, botInsertSchema } from "@/db/schema"

export async function createBot(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("You must be signed in to create a bot.")
  }

  const parsed = botInsertSchema.safeParse({
    name: formData.get("name"),
    job: formData.get("job"),
    instructions: formData.get("instructions") || undefined,
    avatar: formData.get("avatar") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid bot details.")
  }

  const [bot] = await db
    .insert(bots)
    .values({
      ...parsed.data,
      userId,
    })
    .returning({ id: bots.id })

  redirect(`/bots/${bot.id}`)
}
