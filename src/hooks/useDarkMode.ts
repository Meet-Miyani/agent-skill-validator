import { useEffect, useState } from "react"

const STORAGE_KEY = "skill-review-theme"

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "dark") return true
  if (stored === "light") return false
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
}

/** Persists dark mode preference and syncs the `html.dark` class. */
export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    window.localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light")
  }, [darkMode])

  const toggle = () => setDarkMode((v) => !v)
  return { darkMode, toggle }
}
