import type { Category } from "../types/Category"
import type { ProductImage } from "../types/ProductImage"

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  categoryId: string
  category: Category
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface CreateProduct {
  name: string
  description?: string
  price: number
  stock: number
  categoryId: string
  images?: string[]
}

export type UpdateProduct = Partial<CreateProduct>

export interface ProductQuery {
  search?: string
  categoryId?: string
  page?: number
  limit?: number
}
