import { api } from "../lib/axiosConfig"
import { ApiError, toAppError } from "../lib/errors"
import type { Product } from "../types/Product"

export async function getFavorites(): Promise<Product[]> {
  try {
    const { data } = await api.get<Product[]>("/favorites")
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

// 409 = ya estaba en favoritos. El resultado deseado (producto marcado) ya se
// cumple, así que lo tratamos como éxito en vez de propagar el error a la UI.
export async function addFavorite(productId: string): Promise<void> {
  try {
    await api.post(`/favorites/${productId}`)
  } catch (error) {
    const appError = toAppError(error)
    if (appError instanceof ApiError && appError.status === 409) return
    throw appError
  }
}

// 404 = no estaba en favoritos. Mismo criterio: el estado final buscado
// (producto fuera de favoritos) ya es el correcto.
export async function removeFavorite(productId: string): Promise<void> {
  try {
    await api.delete(`/favorites/${productId}`)
  } catch (error) {
    const appError = toAppError(error)
    if (appError instanceof ApiError && appError.status === 404) return
    throw appError
  }
}
