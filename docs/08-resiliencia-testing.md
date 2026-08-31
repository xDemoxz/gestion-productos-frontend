# 08 — Resiliencia y testing (45 min)

**El mejor retorno por minuto de todo el ejercicio.** Es una sección completa de la rúbrica en menos de una hora. No la sacrifiques por pulir una pantalla.

## 8.1 · `components/ErrorBoundary.tsx`

**Analogía:** el breaker eléctrico de la casa. Si un electrodoméstico hace corto, salta el breaker de ese circuito — no se quema la casa entera.

Sin boundary, un error de renderizado en cualquier componente deja la **pantalla en blanco**: React desmonta todo el árbol.

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

// Debe ser clase: React no expone la API de error boundaries a componentes de función.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary capturó un error:", error, info.componentStack)
  }

  handleReset = () => this.setState({ hasError: false, message: "" })

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="m-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-700">Algo salió mal</h2>
        <p className="mt-2 text-sm text-red-600">{this.state.message}</p>
        <button onClick={this.handleReset}>Reintentar</button>
      </div>
    )
  }
}
```

### Lo que te van a preguntar

**¿Por qué clase y no función?** Es la única API de React que no tiene equivalente en hooks. No hay `useErrorBoundary`. Es la excepción legítima a "todo con funciones".

**Los dos métodos hacen cosas distintas:**
- `getDerivedStateFromError` — **estático y puro**. Solo devuelve el nuevo estado. Corre durante el renderizado, así que no puede tener efectos secundarios.
- `componentDidCatch` — corre **después**, y sí puede tener efectos: registrar en consola, enviar a un servicio de monitoreo.

**Qué NO captura** (y esto es lo que más se pregunta):
- ❌ Errores en manejadores de eventos (`onClick`)
- ❌ Promesas rechazadas / código asíncrono
- ❌ Errores del propio boundary

Solo captura errores de **la fase de renderizado**. Todo lo demás sigue necesitando `try/catch` — por eso los servicios y formularios lo tienen.

### Dónde colocarlos

Dos niveles, con propósitos distintos:

```tsx
// main.tsx — la red de seguridad final
<ErrorBoundary>
  <AuthProvider>
    <MainRouter />
  </AuthProvider>
</ErrorBoundary>

// Layout.tsx — aísla el contenido de la navegación
<main>
  <ErrorBoundary>
    <Outlet />
  </ErrorBoundary>
</main>
```

El del `Layout` es el importante: si una página truena, el usuario **conserva la barra de navegación** y puede irse a otra parte. Sin él, se queda atrapado.

## 8.2 · `components/SafeImage.tsx`

```tsx
import { useState } from "react"

interface SafeImageProps {
  src?: string
  alt: string
  className?: string
}

// Una URL rota deja un icono de imagen partida por defecto.
// onError cambia a un placeholder propio.
export function SafeImage({ src, alt, className = "" }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div role="img" aria-label={alt}
        className={`flex items-center justify-center bg-gray-100 text-xs text-gray-400 ${className}`}>
        Sin imagen
      </div>
    )
  }

  return (
    <img src={src} alt={alt} loading="lazy"
      onError={() => setFailed(true)} className={className} />
  )
}
```

Cubre **dos** casos con la misma condición: no hay URL (`!src`) y la URL falló al cargar (`failed`). Ambos terminan en el mismo placeholder.

`role="img"` + `aria-label` mantienen la equivalencia semántica para lectores de pantalla.

`loading="lazy"` difiere la carga de imágenes fuera de pantalla — gratis, y se nota en una grilla.

## 8.3 · Tests

Tres tests cubren la sección: uno de lógica pura, uno de componente, uno de integración.

### Unitario — `lib/errors.test.ts`

```ts
import { describe, expect, it } from "vitest"
import { AxiosError, AxiosHeaders } from "axios"
import { ApiError, NetworkError, toAppError } from "./errors"

function axiosErrorWithStatus(status: number, message?: string | string[]) {
  const error = new AxiosError("request failed")
  error.response = {
    status, statusText: "", data: message ? { message } : {},
    headers: {}, config: { headers: new AxiosHeaders() }
  }
  return error
}

describe("toAppError", () => {
  it("convierte un error sin response en NetworkError", () => {
    expect(toAppError(new AxiosError("Network Error"))).toBeInstanceOf(NetworkError)
  })

  it("convierte un 409 en ApiError marcado como validación", () => {
    const result = toAppError(axiosErrorWithStatus(409, "Ya existe una categoría con este nombre"))
    expect(result).toBeInstanceOf(ApiError)
    expect((result as ApiError).status).toBe(409)
    expect((result as ApiError).isValidation).toBe(true)
  })

  it("une los mensajes de validación que NestJS envía como arreglo", () => {
    const result = toAppError(
      axiosErrorWithStatus(400, ["El correo no es válido", "La contraseña es muy corta"])
    )
    expect(result.message).toBe("El correo no es válido. La contraseña es muy corta")
  })
})
```

**Por qué este archivo primero:** es lógica pura, sin React, sin red. Los tests más rápidos de escribir y los que más valen — y aquí demuestras la diferenciación de errores que pide la rúbrica.

### Integración — `pages/Login.test.tsx`

```tsx
const mockLogin = vi.fn()

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin })
}))

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>)
}

describe("Login (integración)", () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it("envía las credenciales que el usuario escribió", async () => {
    mockLogin.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo"), "santiago@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "miPassword123")
    await user.click(screen.getByRole("button", { name: "Ingresar" }))

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("santiago@example.com", "miPassword123")
    )
  })

  it("muestra un mensaje de error cuando las credenciales son inválidas", async () => {
    mockLogin.mockImplementation(() => { throw new Error("401") })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo"), "malo@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta")
    await user.click(screen.getByRole("button", { name: "Ingresar" }))

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument()
  })
})
```

Puntos clave:
- **`MemoryRouter`** porque el componente usa `useNavigate` y `Link`, que exigen contexto de router.
- **`vi.mock` del AuthContext** aísla la página: no toca red ni Provider real.
- **Camino feliz y camino de error**, ambos. Un test que solo prueba el éxito no demuestra manejo de errores.
- **`getByLabelText`** encuentra el input por su `<label>` — funciona porque los formularios tienen `htmlFor`/`id` correctos. Si el test no encuentra el campo, suele ser que falta esa asociación.

### ⚠️ La trampa que cuesta media hora

```ts
beforeEach(() => mockLogin.mockReset())     // ❌ MAL
beforeEach(() => { mockLogin.mockReset() }) // ✅ BIEN
```

La flecha con **cuerpo de expresión devuelve** el mock. Vitest interpreta un valor devuelto desde `beforeEach` como función de limpieza y **lo invoca después del test** — disparando el mock fuera de cualquier `try/catch`. El error que verás no menciona `beforeEach` por ningún lado.

Usa siempre cuerpo de bloque con llaves.

### Comando

```bash
npm test
```

## Verificación del paso

- [ ] `npm test` en verde
- [ ] Una URL de imagen muerta muestra el placeholder, no el icono roto
- [ ] Un error de renderizado muestra el fallback conservando la navegación
- [ ] Hay al menos un test de lógica pura y uno de integración con ambos caminos

**Siguiente:** [09-verificacion-defensa.md](./09-verificacion-defensa.md)
