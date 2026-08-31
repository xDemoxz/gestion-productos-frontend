# Retrospectiva del simulacro — dónde estabas y qué faltaba

Documento de autoevaluación, escrito con datos medidos del repo (LOC reales, timestamps de archivos), no con impresiones. Sirve para preparar la segunda pasada.

---

## 1. El número grueso

| Métrica | Valor |
|---|---|
| Código funcional que tenías al detenerte | **~220 líneas** |
| De esas, escritas 100% por ti | **~154 líneas** (70%) |
| De esas, transcritas de una referencia | **~108 líneas** (`authService.ts`, `AuthContext.tsx`) |
| Código final del proyecto completo | **1.660 líneas** |
| Cobertura estimada del alcance total | **≈ 25–30%** |

Traducido: llegaste a **poco más de una cuarta parte** del ejercicio. Pero el porcentaje solo no cuenta la historia, porque *cuál* cuarta parte importa más que *cuánta*.

---

## 2. Cobertura por módulo (lo que tenías vs. lo que pedía la rúbrica)

| Módulo | Tenías | Faltaba |
|---|---|---|
| 1. Tipado | **75%** | Genérico reutilizable (`useFetch<T>`/`request<T>`), tipos de input de producto correctos |
| 2. Auth y sesión | **60%** | RBAC completo (`ProtectedRoute`), formularios reales de Login/Register |
| 3. Categorías | **15%** | CRUD real (tu `postCategories` hacía `GET`), UI, admin-only |
| 4. Productos | **0%** | Todo: servicio, hooks, listado paginado, búsqueda, filtros, detalle, formulario |
| 5. Favoritos | **0%** | Todo, incluido el manejo resiliente de 409/404 |
| 6. Errores + testing | **0%** | `ErrorBoundary`, imágenes rotas, Vitest + RTL |

---

## 3. Criterios de evaluación (los 6 que pesan en la nota)

| # | Criterio | Tu estado | Nota |
|---|---|---|---|
| 1 | Arquitectura por capas | **70%** | Tenías `/lib` `/services` `/types` `/routes` `/pages` `/context`. Faltaban `/hooks` y `/components` |
| 2 | Tipado estricto, cero `any` | **60%** | **Cero `any` en todo tu código.** Faltaba el genérico reutilizable |
| 3 | Capa API con interceptor | **65%** | Interceptores correctos y completos. Fallaba la diferenciación de errores |
| 4 | Persistencia + RBAC 2 niveles | **40%** | Persistencia resuelta. RBAC en **0%** — no existía ninguna ruta protegida |
| 5 | Formulario de producto reutilizable | **0%** | No iniciado |
| 6 | Error Boundary + testing | **0%** | No iniciado |

---

## 4. Lo que estaba genuinamente bien (tuyo, sin ayuda)

Esto no es consuelo — es lo que sí debes reconocerte porque lo vas a repetir bien:

**`axiosConfig.ts` es la pieza más fuerte que escribiste.** Los dos interceptores están correctos: el de request adjunta el `Bearer` condicionalmente, el de response captura el 401, limpia el token y hace `Promise.reject(error)` para no tragarse el error. Ese `reject` final es exactamente lo que mucha gente olvida, y es el criterio #3 de la rúbrica resuelto solo. Tu comentario en el código (*"se usa promise porque es una respuesta externa que viene del backend"*) muestra que entendiste el porqué, no que copiaste.

**`tokenStorage.ts` — instinto de centralización correcto.** Envolver `localStorage` en tres funciones en vez de regar `localStorage.getItem` por el proyecto. Es una decisión de diseño, no un accidente.

**Separaste `Category` de `CreateCategory`/`UpdateCategory`.** Esto es sofisticado: distinguir la forma que *recibes* de la que *envías*. Mucha gente con más experiencia usa un solo tipo para todo y sufre después.

**`Pagination<T>` genérico.** Lo escribiste bien al primer intento después de una sola pista.

**Detectaste solo que el Swagger es la fuente de verdad.** No te lo dije yo: tú llegaste con *"me di cuenta que en swagger puedo ver la forma de user"*. Ese reflejo — dejar de adivinar e ir a verificar — es más valioso que cualquier snippet.

**Cero `any` en todo lo que escribiste.** Ni uno.

---

## 5. Lo que te estaba costando tiempo (patrones, no errores sueltos)

**A. Adivinar en vez de verificar.** Tres archivos de tipos con `created_at` cuando el backend siempre mandó `createdAt`. Un `categoryd` sin la `i`. Un `categoryId: number` cuando era UUID string. Cada uno costaba un ciclo de debugging en runtime que se evitaba con 2 minutos de Swagger. **Costo estimado: 30–45 min.**

**B. Archivos zombie por indecisión.** `api.ts` (duplicado comentado de `axiosConfig.ts`), `categoryService.ts` (vacío), `Products.ts` (versión mala de `CreateProduct`), `Login.tsx` exportando `LoginC`. Ninguno rompía nada, pero cada uno es una decisión que dejaste a medias. En una defensa técnica te preguntan "¿y este archivo?" y no tienes respuesta. **Costo: bajo en tiempo, alto en percepción.**

**C. El `catch` que descarta información.** `throw new Error("Joa mani no me tocaba")` destruía el `status` real que el interceptor se había molestado en preservar. Es el criterio #3 a medio resolver: montaste la tubería y la desconectaste al final.

**D. Orden de ataque subóptimo.** Invertiste en pulir tipado (75%) mientras RBAC seguía en 0%. En la rúbrica, el RBAC de 2 niveles pesa más que la tercera iteración de una interfaz.

---

## 6. Tiempo invertido (proxy por timestamps)

Los timestamps de archivos muestran **3 sesiones**:

| Sesión | Rango | Qué salió |
|---|---|---|
| 27-ago | ~11:36 | `tokenStorage.ts` |
| 28-ago | 07:33 → 11:56 (**~4h20 de span**) | Tipos, `axiosConfig.ts`, `authService.ts` |
| 30-ago | 17:24 → 19:00 | `Pagination<T>`, `AuthContext.tsx` |

Span total ≈ **6–7 horas** contra un presupuesto de 8. El span no es tiempo enfocado real, pero sirve como cota superior.

**El dato que importa:** consumiste ~80% del presupuesto para llegar a ~27% del alcance. Y la sesión más productiva (28-ago, 4h20) produjo ~150 líneas — unas **35 líneas por hora**.

---

## 7. ¿Cuánto podrías haber mejorado?

Con los patrones ya conocidos, este proyecto completo son **4–5 horas** de trabajo, no 8. La distribución realista:

| Fase | Tiempo | Por qué |
|---|---|---|
| Tipos desde Swagger | 30 min | Mecánico si no adivinas |
| `axiosConfig` + `errors.ts` | 30 min | Ya sabes hacerlo |
| `authService` + `AuthContext` | 45 min | Patrón que ya escribiste una vez |
| `ProtectedRoute` + Login/Register | 45 min | |
| `useFetch<T>` + hooks derivados | 45 min | El genérico se escribe una vez |
| CRUD productos + categorías | 90 min | Repetitivo una vez existe `useFetch` |
| Favoritos | 20 min | |
| ErrorBoundary + SafeImage + 3 tests | 45 min | |

**Tu cuello de botella no era velocidad de tecleo — eran 3 patrones que nunca habías escrito**: el wrapper HTTP genérico, el Context de sesión, y la ruta protegida. Los tres juntos son ~150 líneas. Una vez que existen, el resto del proyecto es repetición del mismo molde (`service` → `hook` → `page`).

Lo dijiste tú mismo a mitad de sesión: *"entiendo conceptualmente lo que debo hacer pero nunca he hecho antes este flujo"*. El diagnóstico era correcto.

---

## 8. Plan para la segunda pasada

**Orden de ataque sugerido** (distinto al que usaste):

1. **Tipos desde Swagger, sin adivinar** (30 min) — abre `/api/docs` ANTES de escribir la primera interfaz.
2. **`axiosConfig` + `errors.ts` juntos** (30 min) — el interceptor y las clases de error son una sola unidad de trabajo, no dos.
3. **Auth completo end-to-end: service → context → ProtectedRoute → Login** (90 min) — no pases a categorías hasta poder loguearte y ver una ruta protegida funcionando.
4. **`useFetch<T>` una sola vez** (30 min) — es la inversión que hace que los módulos 3, 4 y 5 sean copiar el molde.
5. **Productos → Categorías → Favoritos** (2h) — en ese orden, productos primero porque es donde está la paginación que evalúan.
6. **ErrorBoundary + SafeImage + tests** (45 min) — al final, pero no lo saltes: es el 100% del módulo 6 en menos de una hora.

**Regla de oro:** no pulas un módulo al 100% mientras otro esté en 0%. Un 70% en los seis vale más que un 100% en dos.

**Las 3 preguntas que debes poder responder sin pensar** (te las falló la intuición en esta pasada):
1. ¿Por qué `preventDefault()` en un `onSubmit`? → cancela la recarga nativa del navegador, que destruiría el estado de React antes de que termine la llamada async.
2. ¿Por qué `isLoading` va antes que `!user` en la ruta protegida? → porque `user` es `null` tanto cuando no hay sesión como cuando la respuesta aún no llegó.
3. ¿Por qué el `catch` de axios debe conservar el `status`? → sin él no puedes distinguir "revisa tu conexión" de "ya existe ese nombre" de "no tienes permiso".
