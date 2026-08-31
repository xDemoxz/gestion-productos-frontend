import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { useCategories } from "../hooks/useCategories"
import { createCategory, deleteCategory } from "../services/categoryServiceAxios"
import { getErrorMessage } from "../lib/errors"

export default function CategoriesPage() {
  const { categories, isLoading, error, refetch } = useCategories()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createCategory({ name, description: description || undefined })
      setName("")
      setDescription("")
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return
    try {
      await deleteCategory(id)
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Categorías</h1>

      <form onSubmit={handleCreate} className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium text-gray-800">Nueva categoría</h2>

        {formError && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}

        <input
          required
          minLength={2}
          maxLength={100}
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        <input
          maxLength={255}
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creando..." : "Crear categoría"}
        </button>
      </form>

      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="py-8 text-center text-gray-500">Cargando categorías...</p>
      ) : (
        <ul className="divide-y rounded-lg bg-white shadow-md">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-800">{category.name}</p>
                {category.description && (
                  <p className="text-sm text-gray-500">{category.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/products/new?categoryId=${category.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Agregar producto
                </Link>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
