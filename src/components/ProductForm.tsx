import { useState, type FormEvent } from "react"
import { useCategories } from "../hooks/useCategories"
import type { CreateProduct, Product } from "../types/Product"

interface ProductFormProps {
  initialProduct?: Product
  // Si viene, el form está en contexto de una categoría: no se muestra el select.
  lockedCategoryId?: string
  onSubmit: (dto: CreateProduct) => Promise<void>
  onCancel?: () => void
}

const inputClass =
  "mb-4 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
const labelClass = "mb-1 block text-sm font-medium text-gray-700"

export function ProductForm({
  initialProduct,
  lockedCategoryId,
  onSubmit,
  onCancel
}: ProductFormProps) {
  const { categories, isLoading: loadingCategories } = useCategories()

  const [name, setName] = useState(initialProduct?.name ?? "")
  const [description, setDescription] = useState(initialProduct?.description ?? "")
  const [price, setPrice] = useState(initialProduct?.price?.toString() ?? "")
  const [stock, setStock] = useState(initialProduct?.stock?.toString() ?? "0")
  const [categoryId, setCategoryId] = useState(
    lockedCategoryId ?? initialProduct?.categoryId ?? ""
  )
  const [imagesText, setImagesText] = useState(
    initialProduct?.images?.map((i) => i.url).join("\n") ?? ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const images = imagesText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)

    try {
      await onSubmit({
        name,
        description: description || undefined,
        price: Number(price),
        stock: Number(stock),
        categoryId,
        images: images.length > 0 ? images : undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold text-gray-800">
        {initialProduct ? "Editar producto" : "Nuevo producto"}
      </h2>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <label className={labelClass} htmlFor="name">Nombre</label>
      <input
        id="name"
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />

      <label className={labelClass} htmlFor="description">Descripción</label>
      <textarea
        id="description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={inputClass}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClass} htmlFor="price">Precio</label>
          <input
            id="price"
            type="number"
            required
            min={1}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="stock">Stock</label>
          <input
            id="stock"
            type="number"
            required
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {!lockedCategoryId && (
        <>
          <label className={labelClass} htmlFor="categoryId">Categoría</label>
          <select
            id="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loadingCategories}
            className={inputClass}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </>
      )}

      <label className={labelClass} htmlFor="images">URLs de imágenes (una por línea)</label>
      <textarea
        id="images"
        rows={3}
        value={imagesText}
        onChange={(e) => setImagesText(e.target.value)}
        placeholder="https://ejemplo.com/imagen.jpg"
        className={inputClass}
      />

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
