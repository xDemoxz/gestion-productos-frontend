import { Link } from "react-router"
import { SafeImage } from "./SafeImage"
import type { Product } from "../types/Product"

interface ProductCardProps {
  product: Product
  isFavorite?: boolean
  onToggleFavorite?: (product: Product) => void
}

export function ProductCard({ product, isFavorite, onToggleFavorite }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/products/${product.id}`}>
        <SafeImage
          src={product.images?.[0]?.url}
          alt={product.name}
          className="h-40 w-full object-cover"
        />
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-800 hover:text-blue-600">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-gray-500">{product.category?.name}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            ${product.price.toLocaleString("es-CO")}
          </span>

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(product)}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="text-xl leading-none transition hover:scale-110"
            >
              {isFavorite ? "★" : "☆"}
            </button>
          )}
        </div>

        {product.stock === 0 && (
          <p className="mt-2 text-xs font-medium text-red-600">Sin stock</p>
        )}
      </div>
    </article>
  )
}
