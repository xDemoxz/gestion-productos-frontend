import { useCallback, useEffect, useState } from "react"
import { addFavorite, getFavorites, removeFavorite } from "../services/favoriteService"
import { getErrorMessage } from "../lib/errors"
import type { Product } from "../types/Product"

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setFavorites(await getFavorites())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const isFavorite = useCallback(
    (productId: string) => favorites.some((p) => p.id === productId),
    [favorites]
  )

  const toggle = useCallback(
    async (product: Product) => {
      const wasFavorite = favorites.some((p) => p.id === product.id)

      // Optimistic update: la UI responde de inmediato y se revierte si falla.
      setFavorites((prev) =>
        wasFavorite ? prev.filter((p) => p.id !== product.id) : [...prev, product]
      )

      try {
        if (wasFavorite) {
          await removeFavorite(product.id)
        } else {
          await addFavorite(product.id)
        }
      } catch (err) {
        setFavorites((prev) =>
          wasFavorite ? [...prev, product] : prev.filter((p) => p.id !== product.id)
        )
        setError(getErrorMessage(err))
      }
    },
    [favorites]
  )

  return { favorites, isLoading, error, isFavorite, toggle, refetch: load }
}
