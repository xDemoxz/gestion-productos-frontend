# 06 — Hooks genéricos (30 min)

**Esta es la bisagra del proyecto.** Media hora aquí convierte el paso 07 en repetición de un molde. Si la saltas, cada recurso te cuesta el triple.

## 6.1 · `hooks/useFetch.ts`

El genérico reutilizable que pide la rúbrica.

```ts
import { useCallback, useEffect, useState } from "react"
import { getErrorMessage } from "../lib/errors"

interface UseFetchResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// fetcher debe venir memoizado (useCallback) por quien llama, o el efecto
// se dispararía en cada render.
export function useFetch<T>(fetcher: () => Promise<T>, enabled = true): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    // Si el usuario cambia de página rápido, la respuesta vieja puede llegar
    // después de la nueva. Este flag descarta la obsoleta.
    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetcher()
      .then((result) => { if (!cancelled) setData(result) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [fetcher, enabled, reloadKey])

  return { data, isLoading, error, refetch }
}
```

### Las tres decisiones que hay que poder defender

**1. `<T>` genérico.** El hook no sabe ni le importa qué está trayendo. Quien lo llama declara el tipo: `useFetch<Category[]>(...)`, `useFetch<Pagination<Product>>(...)`.

**2. La bandera `cancelled` (condición de carrera).** Si el usuario pasa rápido de la página 1 a la 2, se disparan dos peticiones. Nada garantiza que la de la página 1 responda primero — si llega tarde, sobrescribiría los datos de la página 2 y el usuario vería contenido equivocado. La función de limpieza del `useEffect` marca `cancelled = true` al desmontar o antes de re-ejecutarse, y las respuestas viejas se descartan.

**3. `reloadKey` para `refetch`.** Necesitas poder recargar tras crear o borrar algo. Incrementar un número es la forma más simple de decirle al efecto "vuelve a correr" sin duplicar la lógica de fetch.

### La trampa: `fetcher` debe estar memoizado

`useEffect` compara dependencias por identidad. Una función nueva en cada render es una dependencia nueva en cada render → efecto infinito. Por eso **todo hook derivado envuelve su fetcher en `useCallback`**.

## 6.2 · `hooks/useCategories.ts` — el caso simple

```ts
export function useCategories() {
  const fetcher = useCallback(() => getCategories(), [])
  const { data, isLoading, error, refetch } = useFetch<Category[]>(fetcher)

  return { categories: data ?? [], isLoading, error, refetch }
}
```

Dependencias `[]`: no hay parámetros, el fetcher nunca cambia.

`data ?? []` convierte `null` en arreglo vacío para que quien lo consuma pueda hacer `.map()` sin comprobar nada.

## 6.3 · `hooks/useProducts.ts` — el caso con parámetros

```ts
export function useProducts(query: ProductQuery) {
  const { search, categoryId, page, limit } = query

  // Dependemos de los campos primitivos, no del objeto query: un objeto nuevo
  // en cada render dispararía el efecto infinitamente.
  const fetcher = useCallback(
    () => getProducts({ search, categoryId, page, limit }),
    [search, categoryId, page, limit]
  )

  const { data, isLoading, error, refetch } = useFetch<Pagination<Product>>(fetcher)

  return {
    products: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
    refetch
  }
}
```

**La línea que más importa:** desestructurar `query` en primitivos antes del `useCallback`.

Si escribieras `useCallback(() => getProducts(query), [query])`, la página construye un objeto literal nuevo en cada render (`{ search, categoryId, page, limit: 8 }`), y aunque los valores sean idénticos, es un objeto **distinto** por identidad. Resultado: bucle infinito de peticiones. Con primitivos (`string`, `number`), la comparación es por valor y solo cambia cuando cambia de verdad.

El hook también **desenvuelve la paginación**: la página recibe `products` y `totalPages` directo, sin saber que vienen dentro de un `data`.

## 6.4 · `hooks/useFavorites.ts` — estado propio y actualización optimista

Este no usa `useFetch` porque además de leer, muta y mantiene su propia lista.

```ts
export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setFavorites(await getFavorites())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const isFavorite = useCallback(
    (productId: string) => favorites.some((p) => p.id === productId),
    [favorites]
  )

  const toggle = useCallback(
    async (product: Product) => {
      const wasFavorite = favorites.some((p) => p.id === product.id)

      // Optimistic update: la UI responde de inmediato y se revierte si falla.
      setFavorites((prev) =>
        wasFavorite ? prev.filter((p) => p.id !== product.id) : [...prev, product]
      )

      try {
        if (wasFavorite) {
          await removeFavorite(product.id)
        } else {
          await addFavorite(product.id)
        }
      } catch (err) {
        setFavorites((prev) =>
          wasFavorite ? [...prev, product] : prev.filter((p) => p.id !== product.id)
        )
        setError(getErrorMessage(err))
      }
    },
    [favorites]
  )

  return { favorites, isLoading, error, isFavorite, toggle, refetch: load }
}
```

**Actualización optimista:** la estrella cambia al instante, sin esperar al servidor. Si la llamada falla, se revierte. Sin esto, el usuario hace clic y nota un retraso incómodo antes de ver el cambio.

Combina con el manejo idempotente del servicio (409/404 tratados como éxito): un doble clic no produce error visible.

`void load()` le dice explícitamente a TypeScript "sé que esto devuelve una promesa y la ignoro a propósito".

## El molde que acabas de construir

```
service  (habla con la API, lanza errores tipados)
   ↓
hook     (estado de carga/error/datos, memoización)
   ↓
page     (renderiza, maneja la intención del usuario)
```

Todo el paso 07 es repetir esto. Si al escribir la tercera página sientes que estás inventando algo, revisa — probablemente te saltaste el hook.

## Verificación del paso

- [ ] La pestaña Network **no** muestra peticiones repitiéndose sin parar
- [ ] Cambiar de página en el listado no deja datos de la página anterior
- [ ] `useFetch` se usa desde al menos dos recursos distintos

**Siguiente:** [07-crud-ui.md](./07-crud-ui.md)
