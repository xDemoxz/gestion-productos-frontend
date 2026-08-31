import { useCallback, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { useFetch } from "../hooks/useFetch"
import { deleteProduct, getProduct } from "../services/productService"
import { getErrorMessage } from "../lib/errors"
import { SafeImage } from "../components/SafeImage"
import type { Product } from "../types/Product"

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetcher = useCallback(() => getProduct(id!), [id])
  const { data: product, isLoading, error } = useFetch<Product>(fetcher, Boolean(id))

  async function handleDelete() {
    if (!id || !confirm("¿Eliminar este producto?")) return
    try {
      await deleteProduct(id)
      navigate("/")
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    }
  }

  if (isLoading) return <p className="py-12 text-center text-gray-500">Cargando...</p>
  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>
  if (!product) return <p className="text-gray-500">Producto no encontrado.</p>

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="grid gap-6 md:grid-cols-2">
        <SafeImage
          src={product.images?.[0]?.url}
          alt={product.name}
          className="h-64 w-full rounded object-cover"
        />

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{product.category?.name}</p>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            ${product.price.toLocaleString("es-CO")}
          </p>
          <p className="mt-2 text-sm text-gray-600">Stock: {product.stock}</p>
          {product.description && (
            <p className="mt-4 text-gray-700">{product.description}</p>
          )}

          {deleteError && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              to={`/products/${product.id}/edit`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
