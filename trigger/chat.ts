import { task, tasks } from "@trigger.dev/sdk"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText, stepCountIs, streamText, tool } from "ai"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { bots, chatMembers, chats, messages } from "@/db/schema"
import { createSandboxTools } from "@/lib/daytona-tools"
import { MEMORY_DIRECTORY } from "@/lib/daytona"
import type { ensureSharedSandboxTask } from "@/trigger/shared-sandbox"

type ChatTaskPayload = {
  userId: string
  chatId: string
  userMessageId: string
  assistantMessageId: string
}

export const chatResponseTask = task({
  id: "paper-chat-response",
  retry: {
    maxAttempts: 3,
  },

  run: async (payload: ChatTaskPayload) => {
    const { userId, chatId, userMessageId, assistantMessageId } = payload

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .limit(1)

    if (!chat) {
      throw new Error("Chat not found or access denied.")
    }

    const [userMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, userMessageId),
          eq(messages.chatId, chatId),
          eq(messages.role, "user")
        )
      )
      .limit(1)

    if (!userMessage) {
      throw new Error("User message not found.")
    }

    const [assistantMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, assistantMessageId),
          eq(messages.chatId, chatId),
          eq(messages.role, "assistant")
        )
      )
      .limit(1)

    if (!assistantMessage) {
      throw new Error("Assistant message not found.")
    }

    await db
      .update(messages)
      .set({ content: "", status: "running" })
      .where(eq(messages.id, assistantMessageId))

    try {
      const memberBots = await db
        .select({
          id: bots.id,
          name: bots.name,
          job: bots.job,
          instructions: bots.instructions,
        })
        .from(chatMembers)
        .innerJoin(bots, eq(chatMembers.botId, bots.id))
        .where(eq(chatMembers.chatId, chatId))

      if (memberBots.length === 0) {
        throw new Error("This chat has no participating bots.")
      }

      const selectedBot =
        memberBots.find((bot) => bot.id === assistantMessage.botId) ??
        memberBots[0]
      const otherBots = memberBots.filter((bot) => bot.id !== selectedBot.id)

      const history = await db
        .select({
          role: messages.role,
          content: messages.content,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.createdAt))
        .limit(40)

      const apiKey = process.env.OPENROUTER_API_KEY

      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured.")
      }

      const openrouter = createOpenRouter({ apiKey })
      const modelName = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"

      let sharedSandboxId: Promise<string> | undefined
      const getSharedSandboxId = () => {
        if (!sharedSandboxId) {
          sharedSandboxId = tasks
            .triggerAndWait<typeof ensureSharedSandboxTask>(
              "paper-ensure-shared-sandbox",
              undefined
            )
            .then((result) => {
              if (!result.ok) {
                throw new Error("Could not prepare the shared sandbox.", {
                  cause: result.error,
                })
              }
              return result.output.sandboxId
            })
            .catch((error) => {
              sharedSandboxId = undefined
              throw error
            })
        }
        return sharedSandboxId
      }

      const conversation = history
        .filter(
          (message) =>
            message.content.trim().length > 0 &&
            message.content !== assistantMessage.content
        )
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n\n")

      let handoffBotId: string | null = null
      let streamedText = ""
      let lastPersistedAt = 0
      const result = streamText({
        model: openrouter.chat(modelName),
        system: `You are ${selectedBot.name}, an AI assistant working in PAPER.

Your role: ${selectedBot.job}
Your instructions: ${selectedBot.instructions || "Use your expertise to help the user."}

You can use the shared Daytona sandbox tools to run commands, work with files, and interact with its desktop. Use them when the task requires execution or inspection in an isolated environment; they provision or wake the shared sandbox only when first used. Your saved memory is specific to you.

Other bots available for delegation:
${
  otherBots.length > 0
    ? otherBots
        .map((bot) => `- ${bot.name} (ID: ${bot.id}; role: ${bot.job})`)
        .join("\n")
    : "No other bots participate in this chat."
}

If another participating bot is better suited to a specific part of the task, use the handoffToBot tool at most once to delegate that work. Include a clear, self-contained task for the other bot. Use the returned work to produce one helpful final answer. Do not claim a handoff occurred unless you called the tool. Respond directly to the latest user message.`,
        prompt: conversation || userMessage.content,
        tools: {
          ...createSandboxTools(
            getSharedSandboxId,
            `${MEMORY_DIRECTORY}/${selectedBot.id}.md`
          ),
          ...(otherBots.length > 0
            ? {
                handoffToBot: tool({
                  description:
                    "Delegate part of the user's task to another bot participating in this chat.",
                  inputSchema: z.object({
                    botId: z.string().min(1),
                    task: z.string().min(1).max(20_000),
                  }),
                  execute: async ({ botId, task }) => {
                    const targetBot = otherBots.find((bot) => bot.id === botId)
                    if (!targetBot) {
                      throw new Error(
                        "Handoffs can only target another bot in this chat."
                      )
                    }

                    if (handoffBotId) {
                      throw new Error(
                        "Only one bot handoff is allowed per response."
                      )
                    }

                    handoffBotId = targetBot.id
                    const delegated = await generateText({
                      model: openrouter.chat(modelName),
                      system: `You are ${targetBot.name}, an AI assistant.
Your role: ${targetBot.job}
Your instructions: ${targetBot.instructions || "Use your expertise to help with the assigned task."}
You can use the shared Daytona sandbox tools to execute the delegated task when useful. Your saved memory is specific to you. Be accurate and concise, and state uncertainty when needed.`,
                      prompt: task,
                      tools: createSandboxTools(
                        getSharedSandboxId,
                        `${MEMORY_DIRECTORY}/${targetBot.id}.md`
                      ),
                      stopWhen: stepCountIs(8),
                    })

                    if (!delegated.text.trim()) {
                      throw new Error(
                        `${targetBot.name} returned an empty handoff response.`
                      )
                    }

                    return {
                      botName: targetBot.name,
                      response: delegated.text,
                    }
                  },
                }),
              }
            : {}),
        },
        stopWhen: stepCountIs(10),
        onChunk: async ({ chunk }) => {
          if (chunk.type !== "text-delta") return

          streamedText += chunk.text
          const now = Date.now()
          if (now - lastPersistedAt < 250) return

          lastPersistedAt = now
          await db
            .update(messages)
            .set({ content: streamedText })
            .where(eq(messages.id, assistantMessageId))
        },
      })
      const text = await result.text

      if (!text.trim()) {
        throw new Error("The model returned an empty response.")
      }

      await db
        .update(messages)
        .set({
          content: text,
          status: "completed",
          handoffBotId,
        })
        .where(eq(messages.id, assistantMessageId))

      await db
        .update(chats)
        .set({
          lastMessagePreview: text.slice(0, 200),
          lastMessageAt: new Date(),
        })
        .where(eq(chats.id, chatId))

      return {
        chatId,
        assistantMessageId,
        status: "completed" as const,
      }
    } catch (error) {
      await db
        .update(messages)
        .set({ status: "failed" })
        .where(eq(messages.id, assistantMessageId))

      throw error
    }
  },
})
