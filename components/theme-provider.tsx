"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = Exclude<Theme, "system">

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

function ThemeHotkey() {
  const theme = React.useContext(ThemeContext)

  React.useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== "d" ||
        isTypingTarget(event.target)
      ) {
        return
      }

      const nextTheme = theme?.resolvedTheme === "dark" ? "light" : "dark"
      theme?.setTheme(nextTheme)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [theme])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setCurrentTheme] = React.useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system"
    }

    const storedTheme = localStorage.getItem("theme")
    return isTheme(storedTheme) ? storedTheme : "system"
  })
  const [systemTheme, setSystemTheme] =
    React.useState<ResolvedTheme>(() =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    )

  const setTheme = React.useCallback((nextTheme: Theme) => {
    localStorage.setItem("theme", nextTheme)
    setCurrentTheme(nextTheme)
  }, [])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light")
    }

    updateSystemTheme()
    mediaQuery.addEventListener("change", updateSystemTheme)

    function onStorage(event: StorageEvent) {
      if (event.key !== "theme") {
        return
      }

      if (isTheme(event.newValue)) {
        setCurrentTheme(event.newValue)
      } else {
        setCurrentTheme("system")
      }
    }

    window.addEventListener("storage", onStorage)
    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const resolvedTheme = theme === "system" ? systemTheme : theme
  React.useEffect(() => applyTheme(resolvedTheme), [resolvedTheme])

  const contextValue = React.useMemo(
    () => ({ resolvedTheme, setTheme }),
    [resolvedTheme, setTheme],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}
