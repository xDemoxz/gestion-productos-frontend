import { useCallback } from "react"
import { useFetch } from "./useFetch"
import { getProducts } from "../services/productService"
import type { Pagination } from "../types/Pagination"
import type { Product, ProductQuery } from "../types/Product"

export function useProducts(query: ProductQuery) {
  const { search, categoryId, page, limit } = query

  // Dependemos de los campos primitivos, no del objeto query: un objeto nuevo
  // en cada render dispararía el efecto infinitamente.
  const fetcher = useCallback(
    () => getProducts({ search, categoryId, page, limit }),
    [search, categoryId, page, limit]
  )

  const { data, isLoading, error, refetch } = useFetch<Pagination<Product>>(fetcher)

  return {
    products: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    refetch
  }
}
