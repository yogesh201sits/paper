
import { relations } from "drizzle-orm"
import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { nanoid } from "nanoid"
import { z } from "zod"

// -----------------------------------------------------------------------------
// Bots
// -----------------------------------------------------------------------------

export const bots = pgTable(
  "bots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),

    // Set exclusively from the authenticated Clerk session
    userId: text("user_id").notNull(),

    name: text("name").notNull(),

    // Stable seed used by PaperAvatar
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),

    job: text("job").notNull(),

    instructions: text("instructions"),

    // Temporary until Daytona sandbox provisioning is implemented
    sandboxId: text("sandbox_id")
      .notNull()
      .default("sandbox-pending"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bots_user_id_idx").on(table.userId),
  ]
)

// -----------------------------------------------------------------------------
// Chats
// -----------------------------------------------------------------------------

export const chatKind = pgEnum("chat_kind", [
  "direct",
  "group",
])

export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),

    // Clerk user ID
    userId: text("user_id").notNull(),

    kind: chatKind().notNull().default("direct"),

    // Null for direct chats; groups have a name
    name: text("name"),

    lastMessagePreview: text("last_message_preview"),

    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chats_user_id_idx").on(table.userId),
    index("chats_user_last_message_idx").on(
      table.userId,
      table.lastMessageAt
    ),
  ]
)

// -----------------------------------------------------------------------------
// Chat members: bots participating in each conversation
// -----------------------------------------------------------------------------

export const chatMembers = pgTable(
  "chat_members",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),

    botId: text("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.chatId, table.botId],
    }),
    index("chat_members_bot_id_idx").on(table.botId),
  ]
)

// -----------------------------------------------------------------------------
// Messages
// -----------------------------------------------------------------------------

export const messageRole = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
])

export const messageStatus = pgEnum("message_status", [
  "queued",
  "running",
  "completed",
  "failed",
])

export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),

    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),

    role: messageRole().notNull(),

    content: text("content").notNull(),

    botId: text("bot_id").references(() => bots.id, { onDelete: "set null" }),

    handoffBotId: text("handoff_bot_id").references(() => bots.id, {
      onDelete: "set null",
    }),

    // Trigger.dev task ID for background execution
    taskId: text("task_id"),

    status: messageStatus().notNull().default("completed"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_chat_id_created_at_idx").on(
      table.chatId,
      table.createdAt
    ),
  ]
)

// -----------------------------------------------------------------------------
// Usage ledger
// -----------------------------------------------------------------------------

export const usageKind = pgEnum("usage_kind", [
  "ai",
  "sandbox",
])

export const usageEntries = pgTable(
  "usage_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),

    // Clerk user ID
    userId: text("user_id").notNull(),

    kind: usageKind().notNull(),

    // AI: millionths of a dollar. Sandbox: running seconds.
    amount: integer("amount").notNull(),

    // Prevents the same metered event from being counted twice
    idempotencyKey: text("idempotency_key")
      .notNull()
      .unique(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_entries_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
)

// -----------------------------------------------------------------------------
// Relations
// -----------------------------------------------------------------------------

export const botsRelations = relations(bots, ({ many }) => ({
  memberships: many(chatMembers),
}))

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
  messages: many(messages),
}))

export const chatMembersRelations = relations(
  chatMembers,
  ({ one }) => ({
    chat: one(chats, {
      fields: [chatMembers.chatId],
      references: [chats.id],
    }),

    bot: one(bots, {
      fields: [chatMembers.botId],
      references: [bots.id],
    }),
  })
)

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}))

// -----------------------------------------------------------------------------
// Validation schemas
// -----------------------------------------------------------------------------

export const botInsertSchema = createInsertSchema(bots, {
  name: (schema) =>
    schema
      .trim()
      .min(1, "Give your bot a name.")
      .max(50, "Keep it under 50 characters."),

  job: (schema) =>
    schema
      .trim()
      .min(1, "Tell your bot what its job is.")
      .max(100, "Keep it under 100 characters."),

  instructions: (schema) =>
    schema.trim().max(4000, "Keep it under 4000 characters."),
}).omit({
  id: true,
  userId: true,
  sandboxId: true,
  createdAt: true,
})

export const groupChatInsertSchema = createInsertSchema(chats, {
  name: z
    .string()
    .trim()
    .min(1, "Give the group a name.")
    .max(50, "Keep it under 50 characters."),
})
  .omit({
    id: true,
    userId: true,
    kind: true,
    lastMessagePreview: true,
    lastMessageAt: true,
    createdAt: true,
  })
  .extend({
    botIds: z
      .array(z.string().min(1))
      .min(2, "Pick at least two bots."),
  })

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Bot = typeof bots.$inferSelect
export type NewBot = typeof bots.$inferInsert
export type BotInsert = z.infer<typeof botInsertSchema>

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type ChatMember = typeof chatMembers.$inferSelect

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type UsageKind = (typeof usageKind.enumValues)[number]
export type NewUsageEntry = typeof usageEntries.$inferInsert

export type GroupChatInsert = z.infer<typeof groupChatInsertSchema>
