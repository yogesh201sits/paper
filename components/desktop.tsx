"use client"

import * as React from "react"
import type RFB from "@novnc/novnc"
import { MonitorIcon, RefreshCwIcon } from "lucide-react"

import { getDesktopUrl } from "@/app/chats/desktop-actions"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Spinner } from "@/components/ui/spinner"

type DesktopStatus = "idle" | "connecting" | "connected" | "disconnected"

type DesktopPanelContextValue = {
  open: boolean
  toggle: () => void
  enabled: boolean
  status: DesktopStatus
  error: string | null
  statusMessage?: string
  connect: () => void
  attachScreen: (slot: HTMLElement) => void
  setInteractive: (interactive: boolean) => void
}

const DesktopPanelContext =
  React.createContext<DesktopPanelContextValue | null>(null)

function useDesktopPanel() {
  const context = React.useContext(DesktopPanelContext)

  if (!context) {
    throw new Error(
      "useDesktopPanel must be used within a DesktopPanelProvider."
    )
  }

  return context
}

function DesktopPanelProvider({
  chatId,
  enabled,
  statusMessage,
  children,
}: {
  chatId: string
  enabled: boolean
  statusMessage?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(true)
  const [status, setStatus] = React.useState<DesktopStatus>("idle")
  const [error, setError] = React.useState<string | null>(null)

  const screenRef = React.useRef<HTMLDivElement | null>(null)
  const rfbRef = React.useRef<RFB | null>(null)
  const interactiveRef = React.useRef(false)
  const attemptRef = React.useRef(0)

  const getScreen = React.useCallback(() => {
    if (!screenRef.current) {
      screenRef.current = document.createElement("div")
      screenRef.current.className = "size-full"
    }

    return screenRef.current
  }, [])

  const connect = React.useCallback(async () => {
    const attempt = ++attemptRef.current

    rfbRef.current?.disconnect()
    rfbRef.current = null
    setError(null)
    setStatus("connecting")

    try {
      const [url, { default: RFB }] = await Promise.all([
        getDesktopUrl(chatId),
        import("@novnc/novnc"),
      ])

      if (attempt !== attemptRef.current) return

      const rfb = new RFB(getScreen(), url)

      rfb.scaleViewport = true
      rfb.background = "transparent"
      rfb.viewOnly = !interactiveRef.current

      rfb.addEventListener("connect", () => {
        if (attempt !== attemptRef.current) return

        setStatus("connected")

        if (interactiveRef.current) {
          rfb.focus()
        }
      })

      rfb.addEventListener("disconnect", (event) => {
        if (attempt !== attemptRef.current) return

        rfbRef.current = null
        if (!event.detail.clean) {
          setError(
            "The desktop connection was interrupted. Reconnect to try again."
          )
        }
        setStatus("disconnected")
      })

      rfbRef.current = rfb
    } catch (cause) {
      if (attempt !== attemptRef.current) return

      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect to the sandbox desktop."
      )
      setStatus("disconnected")
    }
  }, [chatId, getScreen])

  React.useEffect(() => {
    if (!enabled) return

    const timeout = window.setTimeout(() => void connect(), 0)
    return () => window.clearTimeout(timeout)
  }, [enabled, connect])

  const toggle = React.useCallback(() => {
    setOpen((previousOpen) => {
      const nextOpen = !previousOpen

      if (nextOpen && enabled && status === "idle") {
        void connect()
      }

      return nextOpen
    })
  }, [enabled, status, connect])

  const attachScreen = React.useCallback(
    (slot: HTMLElement) => {
      slot.appendChild(getScreen())
    },
    [getScreen]
  )

  const setInteractive = React.useCallback((interactive: boolean) => {
    interactiveRef.current = interactive

    const rfb = rfbRef.current
    if (!rfb) return

    rfb.viewOnly = !interactive

    if (interactive) {
      rfb.focus()
    }
  }, [])

  React.useEffect(() => {
    const attempts = attemptRef
    const connection = rfbRef

    return () => {
      attempts.current++
      connection.current?.disconnect()
      connection.current = null
    }
  }, [])

  const value = React.useMemo(
    () => ({
      open,
      enabled,
      toggle,
      status,
      error,
      statusMessage,
      connect,
      attachScreen,
      setInteractive,
    }),
    [
      open,
      enabled,
      toggle,
      status,
      error,
      statusMessage,
      connect,
      attachScreen,
      setInteractive,
    ]
  )

  return <DesktopPanelContext value={value}>{children}</DesktopPanelContext>
}

function DesktopPanel({ name }: { name: string }) {
  const {
    open,
    enabled,
    status,
    error,
    statusMessage,
    connect,
    attachScreen,
    setInteractive,
  } = useDesktopPanel()

  const [fullscreen, setFullscreen] = React.useState(false)
  const [panelSlot, setPanelSlot] = React.useState<HTMLDivElement | null>(null)
  const [dialogSlot, setDialogSlot] = React.useState<HTMLDivElement | null>(
    null
  )

  React.useLayoutEffect(() => {
    const slot = dialogSlot ?? panelSlot
    if (!slot) return

    attachScreen(slot)
    setInteractive(slot === dialogSlot)
  }, [dialogSlot, panelSlot, attachScreen, setInteractive])

  if (!open) return null

  const title = `${name}'s screen`

  return (
    <>
      <ResizableHandle withHandle />

      <ResizablePanel id="desktop" defaultSize="60%" minSize="30%">
        <Dialog
          open={fullscreen}
          onOpenChange={(open, eventDetails) => {
            if (!open && eventDetails.reason !== "close-press") return
            setFullscreen(open)
          }}
          disablePointerDismissal
        >
          <div className="flex h-full flex-col">
            <div className="flex h-12 shrink-0 items-center justify-end px-4">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reconnect"
                disabled={!enabled || status === "connecting"}
                onClick={connect}
              >
                <RefreshCwIcon />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col items-center gap-4 p-4 pt-0">
              <AspectRatio
                ratio={4 / 3}
                className="w-full max-w-2xl overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
              >
                <div ref={setPanelSlot} className="absolute inset-0" />

                {status === "connected" ? (
                  <DialogTrigger
                    aria-label={`Open ${title} in fullscreen`}
                    className="absolute inset-0 cursor-zoom-in rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    {status === "disconnected" ? (
                      error || "Screen disconnected"
                    ) : statusMessage ? (
                      statusMessage
                    ) : (
                      <Spinner />
                    )}
                  </div>
                )}
              </AspectRatio>

              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>

          <DialogContent
            initialFocus={false}
            className="flex h-svh max-w-none flex-col gap-0 rounded-none p-0 ring-0 sm:max-w-none"
          >
            <DialogHeader className="h-12 shrink-0 justify-center border-b px-4">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <div ref={setDialogSlot} className="min-h-0 flex-1 bg-muted" />
          </DialogContent>
          {error && (
            <p
              role="alert"
              className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-800"
            >
              {error}
            </p>
          )}
        </Dialog>
      </ResizablePanel>
    </>
  )
}

function DesktopPanelLayout({ children }: { children: React.ReactNode }) {
  const { open } = useDesktopPanel()

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0">
      {open && <DesktopPanel name="Sandbox" />}
      <ResizablePanel
        id="chat"
        defaultSize={open ? "40%" : "100%"}
        minSize={open ? "35%" : "100%"}
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function DesktopPanelToggle() {
  const { open, toggle } = useDesktopPanel()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={open}
      onClick={toggle}
    >
      <MonitorIcon />
      {open ? "Hide desktop" : "Show desktop"}
    </Button>
  )
}

export {
  DesktopPanelLayout,
  DesktopPanelProvider,
  DesktopPanelToggle,
  useDesktopPanel,
}
