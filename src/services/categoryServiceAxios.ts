import { api } from "../lib/axiosConfig"
import { toAppError } from "../lib/errors"
import type { Category, CreateCategory, UpdateCategory } from "../types/Category"

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await api.get<Category[]>("/categories")
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getCategory(id: string): Promise<Category> {
  try {
    const { data } = await api.get<Category>(`/categories/${id}`)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function createCategory(dto: CreateCategory): Promise<Category> {
  try {
    const { data } = await api.post<Category>("/categories", dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function updateCategory(id: string, dto: UpdateCategory): Promise<Category> {
  try {
    const { data } = await api.patch<Category>(`/categories/${id}`, dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await api.delete(`/categories/${id}`)
  } catch (error) {
    throw toAppError(error)
  }
}
