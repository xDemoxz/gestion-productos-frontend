import { useFavorites } from "../hooks/useFavorites"
import { ProductCard } from "../components/ProductCard"

export default function FavoritesPage() {
  const { favorites, isLoading, error, isFavorite, toggle } = useFavorites()

  if (isLoading) return <p className="py-12 text-center text-gray-500">Cargando favoritos...</p>

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Mis favoritos</h1>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {favorites.length === 0 ? (
        <p className="py-12 text-center text-gray-500">Todavía no tienes favoritos.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={toggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
