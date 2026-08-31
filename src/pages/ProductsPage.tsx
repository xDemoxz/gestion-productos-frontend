import { useEffect, useState } from "react"
import { Link } from "react-router"
import { useProducts } from "../hooks/useProducts"
import { useCategories } from "../hooks/useCategories"
import { useFavorites } from "../hooks/useFavorites"
import { ProductCard } from "../components/ProductCard"

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [page, setPage] = useState(1)

  const { categories } = useCategories()
  const { isFavorite, toggle } = useFavorites()
  const { products, totalPages, isLoading, error } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 8
  })

  // Debounce: espera 400ms sin tecleo antes de disparar la búsqueda,
  // para no lanzar una petición por cada letra.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
        />

        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(1)
          }}
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <Link
          to="/products/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo producto
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-gray-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={toggle}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
