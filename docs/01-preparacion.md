# 01 — Preparación y reconocimiento (20 min)

## Andamiaje (5 min)

No ensambles el toolchain a mano:

```bash
npm create lumen my-app
```

Elige TypeScript, Tailwind, React Router, Axios y Vitest. Alternativa manual:

```bash
npm create vite@latest my-app -- --template react-ts
npm i axios react-router
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Variables de entorno

`.env` en la raíz:

```
VITE_API_URL=http://localhost:3000
```

**Sin espacios alrededor del `=` y sin punto y coma final.** Vite toma el valor literal: `VITE_API_URL = http://localhost:3000;` produce una URL con espacio inicial y `;` al final, y todas las peticiones fallan con un error que no dice nada.

Agrega `.env` a `.gitignore` y crea `.env.example` con la misma clave sin valores sensibles.

### Configuración de Vitest

En `vite.config.ts` — nota el import:

```ts
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vitest/config"   // ← vitest/config, NO vite

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
})
```

Si importas `defineConfig` desde `"vite"`, la clave `test` no existe en el tipo y `tsc` falla.

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => cleanup())
```

Agrega el script en `package.json`: `"test": "vitest run"`.

## Estructura de carpetas

Créala vacía de una vez — la arquitectura por capas es criterio de evaluación:

```
src/
  types/       solo formas, sin lógica
  lib/         cliente http, errores, storage
  services/    una función por endpoint, sin React
  hooks/       estado de React alrededor de los servicios
  context/     estado transversal (sesión)
  components/  UI reutilizable
  pages/       destinos de ruta
  routes/      router y guards
  test/        setup de pruebas
```

**La regla de capas que evalúan:** un servicio nunca importa React ni toca `localStorage`. Una página nunca llama a `axios` directamente.

## Reconocimiento del backend (15 min)

Nunca adivines el contrato. Esta fase es la que más tiempo ahorra.

### Dónde mirar, en orden de fidelidad

1. **Código fuente del backend**, si lo tienes local — es más preciso que Swagger UI.
2. **JSON de OpenAPI**: `/api/docs-json`, `/api-json`, `/openapi.json`.
3. **Swagger UI** en el navegador.
4. **Una respuesta real** con curl — definitivo para el casing.

### Qué extraer por cada recurso

| Pregunta | Dónde (ejemplo NestJS) |
|---|---|
| Forma que **recibes** | Entidad + `*ResponseDto` |
| Forma que **envías** al crear | `Create*Dto` |
| Forma que **envías** al editar | `Update*Dto` (suele ser `PartialType`) |
| Parámetros de consulta | `Query*Dto` |
| Rutas, métodos, auth | Decoradores del controller |
| **Respuesta real** | El **service**, no el controller |

### Las 8 trampas que cuestan más tiempo

**1. El nombre de columna no es la clave JSON.**

```ts
@CreateDateColumn({ name: 'created_at' })
createdAt: Date;
```

`name: 'created_at'` nombra la **columna en PostgreSQL**. La propiedad de la clase — y por tanto la clave del JSON — es `createdAt`. Asumir snake_case produce tipos que no coinciden con ninguna respuesta.

**2. Las fechas llegan como string.** La entidad dice `Date`, pero JSON no tiene tipo fecha. Tipa `string`.

**3. Campos que nunca llegan al cliente.** El hash de contraseña se elimina en el DTO de respuesta. Si la entidad lo tiene pero el response DTO no, **no existe en tu frontend**.

**4. Relaciones `eager` cambian el payload.**

```ts
@ManyToOne(() => Category, { eager: true })
category: Category;
```

Cada respuesta trae el objeto completo anidado, no solo el id. Tu tipo necesita `categoryId: string` **y** `category: Category` — y te ahorras una petición extra.

**5. Nullable no es opcional.**

| Declaración | Significado |
|---|---|
| `description: string \| null` | La clave siempre viene, el valor puede ser null |
| `description?: string` | La clave puede no venir |

Columna `nullable: true` → `string \| null` al recibir. `@IsOptional()` en el DTO → `?:` al enviar. El mismo campo suele ser nullable al recibir y opcional al enviar: **son dos tipos distintos**.

**6. No toda lista está paginada.** Un endpoint devuelve `{ data, total, page, limit, totalPages }` y otro un arreglo pelado. Lee cada service.

**7. Endpoints que transforman antes de devolver.**

```ts
const favorites = await repo.find({ where: { userId } });
return favorites.map((f) => f.product);
```

La ruta es `/favorites` pero devuelve **productos**. El nombre del recurso en la URL no determina el tipo de respuesta.

**8. Los errores de validación llegan como arreglo.** NestJS devuelve `message` como `string[]` cuando fallan varias validaciones, y como `string` en otros casos. Si no contemplas ambos, la UI muestra `[object Object]`.

### Plantilla de reconocimiento

Llénala antes de escribir la primera interfaz:

```
BASE URL:
AUTH: formato del header, campo del token en la respuesta de login

RECURSO: <nombre>
  GET    /ruta        → <tipo>       público | auth | rol:<rol>
  POST   /ruta        ← <CreateDto>  → <tipo>
  PATCH  /ruta/:id    ← <UpdateDto>  → <tipo>
  DELETE /ruta/:id    → 204 sin body
  PAGINADO: sí/no
  QUERY PARAMS:
  NOTAS: relaciones eager, transformaciones, semántica de 409/404
```

## Verificación del paso

- [ ] `npm run dev` levanta y muestra algo
- [ ] `.env` sin espacios ni `;`, y en `.gitignore`
- [ ] Carpetas creadas
- [ ] Plantilla de reconocimiento llena para todos los recursos

**Siguiente:** [02-tipado.md](./02-tipado.md)
