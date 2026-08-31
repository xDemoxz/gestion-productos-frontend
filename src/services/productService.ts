import { api } from "../lib/axiosConfig"
import { toAppError } from "../lib/errors"
import type { Pagination } from "../types/Pagination"
import type { CreateProduct, Product, ProductQuery, UpdateProduct } from "../types/Product"

export async function getProducts(query: ProductQuery = {}): Promise<Pagination<Product>> {
  try {
    const { data } = await api.get<Pagination<Product>>("/products", { params: query })
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function getProduct(id: string): Promise<Product> {
  try {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function createProduct(dto: CreateProduct): Promise<Product> {
  try {
    const { data } = await api.post<Product>("/products", dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function updateProduct(id: string, dto: UpdateProduct): Promise<Product> {
  try {
    const { data } = await api.patch<Product>(`/products/${id}`, dto)
    return data
  } catch (error) {
    throw toAppError(error)
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await api.delete(`/products/${id}`)
  } catch (error) {
    throw toAppError(error)
  }
}
