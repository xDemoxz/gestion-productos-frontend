export interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCategory {
  name: string
  description?: string
}

export interface UpdateCategory {
  name?: string
  description?: string
}
