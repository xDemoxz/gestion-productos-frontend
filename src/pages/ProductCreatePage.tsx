import { useNavigate, useSearchParams } from "react-router"
import { ProductForm } from "../components/ProductForm"
import { createProduct } from "../services/productService"
import type { CreateProduct } from "../types/Product"

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ?categoryId=... => el form se abre en contexto de esa categoría y oculta el select.
  const lockedCategoryId = searchParams.get("categoryId") ?? undefined

  async function handleSubmit(dto: CreateProduct) {
    const product = await createProduct(dto)
    navigate(`/products/${product.id}`)
  }

  return (
    <ProductForm
      lockedCategoryId={lockedCategoryId}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
    />
  )
}
