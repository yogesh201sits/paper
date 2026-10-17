import { eq } from "drizzle-orm"
import { task } from "@trigger.dev/sdk"

import { db } from "@/db"
import { sharedSandboxes } from "@/db/schema"
import { getConfiguredSharedSandboxId, getSharedSandbox } from "@/lib/daytona"
import { DaytonaNotFoundError } from "@daytona/sdk"

const SHARED_SANDBOX_KEY = "paper"

export const ensureSharedSandboxTask = task({
  id: "paper-ensure-shared-sandbox",
  concurrency: { total: 1 },
  retry: { maxAttempts: 3 },

  run: async () => {
    const sandboxId = getConfiguredSharedSandboxId()
    const [stored] = await db
      .select({ sandboxId: sharedSandboxes.sandboxId })
      .from(sharedSandboxes)
      .where(eq(sharedSandboxes.id, SHARED_SANDBOX_KEY))
      .limit(1)

    try {
      await getSharedSandbox(sandboxId)
    } catch (error) {
      if (error instanceof DaytonaNotFoundError) {
        throw new Error(
          `Configured shared Daytona sandbox ${sandboxId} was not found or is not accessible.`
        )
      }
      throw error
    }

    if (stored?.sandboxId === sandboxId) {
      return { sandboxId, created: false }
    }

    await db
      .insert(sharedSandboxes)
      .values({
        id: SHARED_SANDBOX_KEY,
        sandboxId,
      })
      .onConflictDoUpdate({
        target: sharedSandboxes.id,
        set: { sandboxId, updatedAt: new Date() },
      })

    return { sandboxId, created: false }
  },
})
