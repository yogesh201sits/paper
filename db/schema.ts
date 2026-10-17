import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { nanoid } from "nanoid"

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

export type Bot = typeof bots.$inferSelect
export type NewBot = typeof bots.$inferInsert
export type BotInsert = typeof botInsertSchema._output
