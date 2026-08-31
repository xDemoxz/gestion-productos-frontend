# 09 — Verificación final y defensa (25 min)

Una fase que compila pero nunca se ejecutó **no está terminada**. Esto es lo que hará el evaluador; hazlo tú primero.

## 9.1 · Los tres comandos

```bash
npx tsc -b --noEmit
```
```bash
npm run build
```
```bash
npm test
```

Los tres deben pasar. `tsc --noEmit` y `npm run build` no son redundantes: el segundo también compila los assets y puede fallar por cosas que el primero no ve.

## 9.2 · Pruebas manuales

- [ ] Registrarse crea la cuenta e inicia sesión de una vez
- [ ] Iniciar sesión guarda el token (DevTools → Application → Local Storage)
- [ ] **Recarga dura (F5) con sesión activa: sobrevive, no rebota a login**
- [ ] Cerrar sesión limpia el token y las rutas privadas redirigen
- [ ] Ruta restringida por rol con cuenta sin privilegios: **redirige** (probar por URL directa, no solo por el enlace)
- [ ] El enlace restringido no aparece en la navegación para roles sin permiso
- [ ] Búsqueda con debounce: una petición por pausa, no una por tecla
- [ ] Búsqueda + filtro + paginación combinables; cambiar filtro vuelve a página 1
- [ ] Estados "cargando" y "sin resultados" distinguibles
- [ ] Nombre duplicado al crear: mensaje **específico** del backend, no genérico
- [ ] Backend apagado: dice que no hay conexión, no falla en silencio
- [ ] URL de imagen muerta: placeholder, no icono roto
- [ ] Consola del navegador limpia

## 9.3 · Limpieza del repo

Los archivos zombie restan en la defensa, aunque no rompan nada:

- [ ] Sin archivos vacíos ni stubs abandonados
- [ ] Sin duplicados comentados
- [ ] Sin nombres inconsistentes (archivo `Login.tsx` exportando `LoginC`)
- [ ] `.env` en `.gitignore`, `.env.example` presente
- [ ] Cero `any` sin justificar

## 9.4 · Mapa de criterios → archivos

Ten esto listo: la pregunta "¿dónde está X?" es la más frecuente.

| Criterio | Archivo |
|---|---|
| Arquitectura por capas | estructura de `src/` |
| Tipado estricto | `types/*.ts` |
| Genérico reutilizable | `hooks/useFetch.ts` |
| Interceptor de `Authorization` | `lib/axiosConfig.ts` |
| 401 centralizado | `lib/axiosConfig.ts` |
| Errores diferenciados | `lib/errors.ts` |
| `try/catch/finally` | `services/*.ts` + manejadores de submit |
| Persistencia de sesión | `lib/tokenStorage.ts` + `context/AuthContext.tsx` |
| RBAC nivel 1 y 2 | `routes/ProtectedRoute.tsx` + `routes/router.tsx` |
| CRUD paginado + búsqueda + filtro | `pages/ProductsPage.tsx` + `hooks/useProducts.ts` |
| Formulario reutilizable | `components/ProductForm.tsx` |
| Error Boundary | `components/ErrorBoundary.tsx` |
| Imágenes rotas | `components/SafeImage.tsx` |
| Testing | `lib/errors.test.ts`, `pages/Login.test.tsx` |

## 9.5 · Preguntas de defensa

### ¿Por qué el guard revisa `isLoading` antes que `!user`?

Porque `user` vale `null` en dos situaciones opuestas: cuando no hay sesión, y cuando la respuesta del backend todavía no llega. Mirando solo `user` son indistinguibles. Si decides primero por `!user`, una recarga con sesión válida expulsa al usuario a login — el bug más visible posible en una demo.

### ¿Por qué `preventDefault()` en el submit?

Un `<form>` recarga la página al enviarse (comportamiento nativo del navegador). Esa recarga destruye el estado de React antes de que la llamada asíncrona termine. `preventDefault` cancela ese comportamiento; el evento de React se dispara igual, con o sin él.

### ¿Por qué el interceptor debe volver a rechazar el error?

Sin `Promise.reject(error)` el error se consume ahí y el `catch` de quien llamó nunca corre — el código de arriba cree que todo salió bien. El interceptor observa y actúa, pero no consume.

### ¿Por qué dos clases de error y no una?

`NetworkError` no tiene status porque nunca hubo respuesta; `ApiError` sí. Unificarlas obligaría a `status?: number` y a comprobar su existencia en cada `catch`, en vez de preguntar `instanceof` directamente.

### ¿Por qué el control de acceso del frontend no es seguridad?

Ocultar un enlace y redirigir una ruta solo mejora la experiencia: cualquiera puede llamar al endpoint desde las herramientas del navegador. La puerta real está en el backend, que rechaza por su cuenta con 403. El frontend evita mostrar puertas que no se pueden abrir.

### ¿Por qué `localStorage` y no `sessionStorage`?

`localStorage` sobrevive al cierre de la pestaña: la sesión persiste entre visitas. `sessionStorage` muere con ella, lo que reduce la ventana de exposición en equipos compartidos. Es decisión de producto; lo importante es poder justificarla.

### ¿Por qué `role` es derivado y no un estado aparte?

Con su propio `useState` habría dos fuentes de verdad que pueden desincronizarse (actualizas `user` y olvidas `role`). Derivarlo con `user?.role ?? null` elimina el problema por diseño.

### ¿Por qué el Error Boundary es una clase?

Es la única API de React sin equivalente en hooks. No existe `useErrorBoundary`. Y solo captura errores de la fase de renderizado: los manejadores de eventos y las promesas rechazadas siguen necesitando `try/catch`.

### ¿Por qué los hooks dependen de primitivos y no del objeto query?

Un objeto literal se recrea en cada render y, aunque los valores sean idénticos, es distinto por identidad. Como dependencia de `useEffect` produce un bucle infinito de peticiones. Con primitivos la comparación es por valor.

### ¿Por qué 409 y 404 se tratan como éxito en favoritos?

Porque el estado final buscado ya se cumple: 409 al agregar significa que ya estaba; 404 al quitar, que ya no estaba. Mostrar un error rojo por eso confundiría al usuario sin motivo.

## 9.6 · Triage de la última hora

En orden estricto:

1. **Llenar los ceros de la rúbrica.** Un criterio ausente no puntúa nada; uno a medias sí.
2. **Verificar que los tres comandos pasen.**
3. **Borrar archivos muertos.**
4. **Pulir**, solo si sobra tiempo.

Nunca pulas mientras algo siga en cero.

---

**Retrospectiva de la primera pasada:** [10-retrospectiva.md](./10-retrospectiva.md)
