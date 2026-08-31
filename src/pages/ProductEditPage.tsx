import { useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { useFetch } from "../hooks/useFetch"
import { ProductForm } from "../components/ProductForm"
import { getProduct, updateProduct } from "../services/productService"
import type { CreateProduct, Product } from "../types/Product"

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const fetcher = useCallback(() => getProduct(id!), [id])
  const { data: product, isLoading, error } = useFetch<Product>(fetcher, Boolean(id))

  async function handleSubmit(dto: CreateProduct) {
    await updateProduct(id!, dto)
    navigate(`/products/${id}`)
  }

  if (isLoading) return <p className="py-12 text-center text-gray-500">Cargando...</p>
  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>
  if (!product) return <p className="text-gray-500">Producto no encontrado.</p>

  return (
    <ProductForm
      initialProduct={product}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
    />
  )
}
