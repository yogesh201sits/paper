"use server"

import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"

import {
  getConfiguredSharedSandboxId,
  getSharedSandbox,
  takeSandboxScreenshot,
} from "@/lib/daytona"
import type { ensureSharedSandboxTask } from "@/trigger/shared-sandbox"

export async function getSharedSandboxScreen() {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  if (!process.env.DAYTONA_API_KEY) {
    throw new Error("DAYTONA_API_KEY is not configured.")
  }

  const sandbox = await getSharedSandbox(getConfiguredSharedSandboxId())
  const { status } = await sandbox.computerUse.getStatus()
  if (status !== "active") await sandbox.computerUse.start()

  return takeSandboxScreenshot(sandbox)
}

export async function provisionSharedSandbox() {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  if (!process.env.DAYTONA_API_KEY) {
    throw new Error("DAYTONA_API_KEY is not configured.")
  }

  const handle = await tasks.trigger<typeof ensureSharedSandboxTask>(
    "paper-ensure-shared-sandbox",
    undefined
  )

  return handle.id
}
