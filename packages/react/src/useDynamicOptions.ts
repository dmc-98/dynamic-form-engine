import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { SelectOption, OptionsPage } from '@dmc--98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseDynamicOptionsConfig {
  /** API endpoint for fetching options */
  endpoint: string
  /** Number of items per page */
  pageSize?: number
  /** Current search query */
  search?: string
  /** Dependent field value (for cascading dropdowns) */
  dependsOnValue?: unknown
  /** Dependency parameter name */
  dependsOnParam?: string
  /** Custom fetch function */
  fetchFn?: typeof fetch
  /** Additional headers */
  headers?: Record<string, string>
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean
}

export interface UseDynamicOptionsReturn {
  /** Loaded options */
  options: SelectOption[]
  /** Whether options are loading */
  isLoading: boolean
  /** Whether more pages are available */
  hasMore: boolean
  /** Load the next page of options */
  loadMore: () => Promise<void>
  /** Reset and reload with new search query */
  search: (query: string) => void
  /** Error message if fetch failed */
  error: string | null
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * React hook for loading dynamic SELECT field options with
 * cursor-based pagination, search, and dependent field support.
 *
 * @example
 * ```tsx
 * const { options, isLoading, hasMore, loadMore, search } = useDynamicOptions({
 *   endpoint: '/api/dfe/fields/department-field/options',
 *   pageSize: 20,
 *   dependsOnValue: selectedCountry,
 *   dependsOnParam: 'countryId',
 * })
 * ```
 */
export function useDynamicOptions(config: UseDynamicOptionsConfig): UseDynamicOptionsReturn {
  const {
    endpoint,
    pageSize = 20,
    search: initialSearch = '',
    dependsOnValue,
    dependsOnParam,
    fetchFn = fetch,
    headers,
    enabled = true,
  } = config

  const [options, setOptions] = useState<SelectOption[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const abortRef = useRef<AbortController | null>(null)

  // The `headers` prop is typically an inline object literal, which creates a
  // new reference on every render. Derive a stable identity from its contents
  // so it can safely live in `fetchPage`'s dependency list without making the
  // callback (and the effects that depend on it) unstable.
  const headersKey = JSON.stringify(headers ?? {})
  const stableHeaders = useMemo<Record<string, string>>(
    () => (headers ?? {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headersKey],
  )

  const fetchPage = useCallback(async (
    currentCursor: string | null,
    query: string,
    reset: boolean,
  ) => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('pageSize', String(pageSize))
      if (currentCursor) params.set('cursor', currentCursor)
      if (query) params.set('q', query)
      if (dependsOnValue !== undefined && dependsOnParam) {
        params.set(dependsOnParam, String(dependsOnValue))
      }

      const url = `${endpoint}?${params.toString()}`
      const res = await fetchFn(url, {
        signal: controller.signal,
        headers: stableHeaders,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const page: OptionsPage = await res.json()

      setOptions(prev => reset ? page.items : [...prev, ...page.items])
      setCursor(page.nextCursor)
      setHasMore(page.nextCursor !== null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, pageSize, dependsOnValue, dependsOnParam, fetchFn, stableHeaders])

  // Keep the latest search query in a ref so the reload effect below can read it
  // without listing it as a dependency (search has its own debounced entry
  // point via `search()`; we don't want every keystroke to trigger this effect).
  const searchQueryRef = useRef(searchQuery)
  searchQueryRef.current = searchQuery

  // Initial load and reload when any real input changes. `pageSize`,
  // `dependsOnParam`, `dependsOnValue`, `stableHeaders`, and `fetchFn` are all
  // captured by `fetchPage`, so depending on `fetchPage` (which changes when any
  // of them change) correctly re-triggers a reload.
  useEffect(() => {
    if (!enabled) return
    setOptions([])
    setCursor(null)
    setHasMore(true)
    fetchPage(null, searchQueryRef.current, true)
  }, [enabled, fetchPage])

  // Abort any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), [])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchPage(cursor, searchQuery, false)
  }, [cursor, hasMore, isLoading, searchQuery, fetchPage])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
    setOptions([])
    setCursor(null)
    setHasMore(true)
    fetchPage(null, query, true)
  }, [fetchPage])

  return { options, isLoading, hasMore, loadMore, search, error }
}
