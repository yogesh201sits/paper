import { Daytona, DaytonaNotFoundError, type Sandbox } from "@daytona/sdk"

export function getDaytona() {
  if (!process.env.DAYTONA_API_KEY) {
    throw new Error("DAYTONA_API_KEY is not configured.")
  }

  return new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
    apiUrl: process.env.DAYTONA_API_URL || "https://app.daytona.io/api",
  })
}

export const DEFAULT_SHARED_SANDBOX_ID = "cea517a4-935c-4b41-9b4f-878d7e9ea3df"

export function getConfiguredSharedSandboxId() {
  return process.env.PAPER_SHARED_SANDBOX_ID || DEFAULT_SHARED_SANDBOX_ID
}

export const MEMORY_DIRECTORY = "memories"

export async function createSharedSandbox() {
  const sandbox = await getDaytona().create({
    labels: { app: "paper", scope: "shared" },
  })
  return sandbox.id
}

export async function getSharedSandbox(sandboxId: string) {
  const sandbox = await getDaytona().get(sandboxId)
  if (sandbox.state !== "started") await sandbox.start()
  return sandbox
}

export async function readBotMemory(sandbox: Sandbox, memoryFile: string) {
  const { exitCode, result } = await sandbox.process.executeCommand(
    `mkdir -p ${MEMORY_DIRECTORY} && touch ${memoryFile} && cat ${memoryFile}`
  )
  if (exitCode !== 0) throw new Error(`Reading ${memoryFile} failed: ${result}`)
  return result
}

const VNC_PORT = 6080

export async function getSharedSandboxDesktopUrl(sandboxId: string) {
  const sandbox = await getSharedSandbox(sandboxId)

  const { status } = await sandbox.computerUse.getStatus()
  if (status !== "active") await sandbox.computerUse.start()

  const preview = await sandbox.getSignedPreviewUrl(VNC_PORT, 60 * 60)
  const url = new URL("/websockify", preview.url)
  url.protocol = "wss:"
  return url.toString()
}

export async function takeSandboxScreenshot(sandbox: Sandbox) {
  const [shot, display] = await Promise.all([
    sandbox.computerUse.screenshot.takeCompressed({
      format: "jpeg",
      quality: 70,
      showCursor: true,
    }),
    sandbox.computerUse.display.getInfo(),
  ])
  if (!shot.screenshot) throw new Error("The screenshot came back empty")

  const screen = display.displays?.[0]
  return {
    base64: shot.screenshot,
    mediaType: "image/jpeg",
    width: screen?.width,
    height: screen?.height,
  }
}

export async function deleteSharedSandbox(sandboxId: string) {
  try {
    const sandbox = await getDaytona().get(sandboxId)
    await getDaytona().delete(sandbox)
  } catch (error) {
    if (error instanceof DaytonaNotFoundError) return
    throw error
  }
}

export async function listRunningSandboxIds() {
  const ids: string[] = []
  for await (const sandbox of getDaytona().list({
    states: ["started", "starting", "stopping"],
  })) {
    ids.push(sandbox.id)
  }
  return ids
}

export async function stopSharedSandbox(sandboxId: string) {
  const sandbox = await getDaytona().get(sandboxId)
  if (sandbox.state === "started") await sandbox.stop()
}
