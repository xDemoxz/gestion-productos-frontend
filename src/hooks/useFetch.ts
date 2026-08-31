import { useCallback, useEffect, useState } from "react"
import { getErrorMessage } from "../lib/errors"

interface UseFetchResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// fetcher debe venir memoizado (useCallback) por quien llama, o el efecto
// se dispararía en cada render.
export function useFetch<T>(fetcher: () => Promise<T>, enabled = true): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    // Si el usuario cambia de página rápido, la respuesta vieja puede llegar
    // después de la nueva. Este flag descarta la obsoleta.
    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, enabled, reloadKey])

  return { data, isLoading, error, refetch }
}
