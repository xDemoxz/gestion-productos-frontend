import { useCallback } from "react"
import { useFetch } from "./useFetch"
import { getCategories } from "../services/categoryServiceAxios"
import type { Category } from "../types/Category"

export function useCategories() {
  const fetcher = useCallback(() => getCategories(), [])
  const { data, isLoading, error, refetch } = useFetch<Category[]>(fetcher)

  return { categories: data ?? [], isLoading, error, refetch }
}
