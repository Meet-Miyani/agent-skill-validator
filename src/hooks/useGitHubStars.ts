import { useEffect, useState } from "react"

const CACHE_KEY = "agent-skill-validator-stars"
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface CachedStars { count: number; fetchedAt: number }

function readCache(): CachedStars | null {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "")
    if (typeof parsed?.count === "number" && typeof parsed?.fetchedAt === "number") return parsed
  } catch { /* ignore */ }
  return null
}

/** Fetches GitHub star count with a 6-hour localStorage cache. */
export function useGitHubStars(repoApiUrl: string): number | null {
  const [stars, setStars] = useState<number | null>(() => readCache()?.count ?? null)

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return

    const controller = new AbortController()
    fetch(repoApiUrl, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (typeof data?.stargazers_count !== "number") return
        const next = { count: data.stargazers_count, fetchedAt: Date.now() }
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(next))
        setStars(next.count)
      })
      .catch(() => {
        const fallback = readCache()
        if (fallback) setStars(fallback.count)
      })

    return () => controller.abort()
  }, [repoApiUrl])

  return stars
}

/** Formats a star count as "1.2k", "12k", or plain number. */
export function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  return new Intl.NumberFormat("en-US").format(count)
}
