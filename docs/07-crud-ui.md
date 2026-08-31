# 07 — CRUD y formulario reutilizable (120 min)

Con el molde del paso 06 listo, esto es repetición. Empieza por el recurso paginado: ahí viven los puntos de búsqueda, filtro y paginación.

## 7.1 · `pages/ProductsPage.tsx` — listado con búsqueda, filtro y paginación

### El estado

```tsx
const [searchInput, setSearchInput] = useState("")   // lo que el usuario teclea
const [search, setSearch] = useState("")             // lo que se envía a la API
const [categoryId, setCategoryId] = useState("")
const [page, setPage] = useState(1)
```

**Dos estados para la búsqueda, no uno.** `searchInput` cambia con cada tecla; `search` solo después de la pausa. Es lo que permite el debounce.

### Debounce

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput)
    setPage(1)
  }, 400)
  return () => clearTimeout(timer)
}, [searchInput])
```

Sin esto, escribir "audífonos" dispara 9 peticiones. Con esto, una.

**Cómo funciona:** cada tecla reinicia el efecto; la función de limpieza cancela el temporizador anterior. Solo cuando pasan 400 ms sin teclear, el temporizador sobrevive y dispara.

`setPage(1)` es obligatorio: si estabas en la página 5 y buscas algo nuevo, los resultados pueden tener solo 2 páginas. Sin el reset verías una página vacía.

### Conectar los hooks

```tsx
const { categories } = useCategories()
const { isFavorite, toggle } = useFavorites()
const { products, totalPages, isLoading, error } = useProducts({
  search: search || undefined,
  categoryId: categoryId || undefined,
  page,
  limit: 8
})
```

`search || undefined` convierte `""` en `undefined` para que axios **omita** el parámetro en vez de enviar `?search=`.

### Los tres estados de la lista

```tsx
{isLoading ? (
  <p>Cargando productos...</p>
) : products.length === 0 ? (
  <p>No se encontraron productos.</p>
) : (
  <div className="grid ...">
    {products.map((product) => (
      <ProductCard key={product.id} product={product}
        isFavorite={isFavorite(product.id)} onToggleFavorite={toggle} />
    ))}
  </div>
)}
```

**"Cargando" y "vacío" son mensajes distintos.** Es el mismo principio de `isLoading` en el AuthContext: un arreglo vacío significa dos cosas — "todavía no llegan" y "llegaron cero" — y el usuario necesita saber cuál.

### Paginación

```tsx
{totalPages > 1 && (
  <div>
    <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Anterior</button>
    <span>Página {page} de {totalPages}</span>
    <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Siguiente</button>
  </div>
)}
```

Los controles se ocultan si solo hay una página, y los botones se deshabilitan en los extremos.

## 7.2 · `components/ProductForm.tsx` — el formulario reutilizable

Criterio explícito de la rúbrica: **el mismo formulario debe servir en dos contextos**.

```tsx
interface ProductFormProps {
  initialProduct?: Product        // ausente = crear, presente = editar
  lockedCategoryId?: string       // presente = oculta el select
  onSubmit: (dto: CreateProduct) => Promise<void>
  onCancel?: () => void
}
```

Tres propiedades opcionales cubren tres usos:

| Uso | Props | Comportamiento |
|---|---|---|
| Crear desde el listado | ninguna | Muestra `<select>` de categorías |
| Crear desde una categoría | `lockedCategoryId` | Oculta el select, categoría fija |
| Editar | `initialProduct` | Campos precargados |

### El select condicional

```tsx
{!lockedCategoryId && (
  <>
    <label htmlFor="categoryId">Categoría</label>
    <select id="categoryId" required value={categoryId}
      onChange={(e) => setCategoryId(e.target.value)}
      disabled={loadingCategories}>
      <option value="">Selecciona una categoría</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </select>
  </>
)}
```

El estado inicial resuelve la prioridad:

```tsx
const [categoryId, setCategoryId] = useState(
  lockedCategoryId ?? initialProduct?.categoryId ?? ""
)
```

Categoría bloqueada → la del producto que edito → vacío.

### Cómo se activa el contexto de categoría

Desde `CategoriesPage`:

```tsx
<Link to={`/products/new?categoryId=${category.id}`}>Agregar producto</Link>
```

Y en `ProductCreatePage`:

```tsx
const [searchParams] = useSearchParams()
const lockedCategoryId = searchParams.get("categoryId") ?? undefined

return <ProductForm lockedCategoryId={lockedCategoryId} onSubmit={handleSubmit} ... />
```

**El query param es el que decide el contexto.** No hay dos formularios ni una bandera booleana inventada: la URL lleva la información.

### Transformar antes de enviar

```tsx
const images = imagesText
  .split("\n")
  .map((url) => url.trim())
  .filter(Boolean)

await onSubmit({
  name,
  description: description || undefined,
  price: Number(price),
  stock: Number(stock),
  categoryId,
  images: images.length > 0 ? images : undefined
})
```

Los inputs de HTML **siempre dan strings**, incluso `type="number"`. Sin `Number(price)` mandarías `"129900"` y el backend rechazaría con 400.

`|| undefined` y `length > 0 ? ... : undefined` evitan enviar campos vacíos que el validador rechazaría.

## 7.3 · Páginas contenedoras

Son delgadas a propósito — solo conectan.

```tsx
// ProductCreatePage.tsx
export default function ProductCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
```

`navigate(-1)` es "volver atrás", equivalente al botón del navegador.

Nota que `handleSubmit` **no** tiene `try/catch`: el error se propaga al `ProductForm`, que ya lo muestra. Una sola capa maneja el error, no dos.

## 7.4 · `components/ProductCard.tsx`

```tsx
<SafeImage
  src={product.images?.[0]?.url}
  alt={product.name}
  className="h-40 w-full object-cover"
/>
```

El encadenamiento opcional `?.[0]?.url` cubre producto sin arreglo de imágenes y arreglo vacío.

```tsx
<p className="mt-1 text-xs text-gray-500">{product.category?.name}</p>
```

Esto funciona **sin una petición extra** porque el backend usa `eager: true` — lo que descubriste en el reconocimiento.

```tsx
<button onClick={() => onToggleFavorite(product)}
  aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}>
  {isFavorite ? "★" : "☆"}
</button>
```

El `aria-label` es necesario porque el contenido visible es un símbolo, no texto legible — y además hace el botón consultable en los tests.

## 7.5 · `pages/CategoriesPage.tsx` — CRUD admin-only

Formulario de creación y lista con eliminación, todo en una página. Tras cada mutación, `refetch()`:

```tsx
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
```

`getErrorMessage(err)` es lo que hace que un nombre duplicado muestre **"Ya existe una categoría con este nombre"** (el mensaje real del backend) en vez de un texto genérico. Todo el trabajo del paso 03 se paga aquí.

## Verificación del paso

- [ ] Búsqueda con debounce: una petición por pausa, no una por tecla
- [ ] Buscar o filtrar devuelve a la página 1
- [ ] Estados "cargando" y "vacío" distinguibles
- [ ] El formulario funciona en los tres usos (crear, crear con categoría fija, editar)
- [ ] Crear una categoría duplicada muestra el mensaje real del backend
- [ ] La estrella de favorito responde al instante

**Siguiente:** [08-resiliencia-testing.md](./08-resiliencia-testing.md)
