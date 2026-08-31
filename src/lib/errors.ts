import axios from "axios"

export class NetworkError extends Error {
  constructor(message = "No se pudo conectar con el servidor") {
    super(message)
    this.name = "NetworkError"
  }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 404 || this.status === 409
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403
  }
}

// Traduce cualquier error de axios a NetworkError o ApiError.
// Sin esto, cada catch tendría que hurgar en error.response?.status a mano.
export function toAppError(error: unknown): NetworkError | ApiError {
  if (error instanceof NetworkError || error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    // Sin response = la petición nunca llegó al servidor (caído, CORS, sin red).
    if (!error.response) return new NetworkError()

    const data = error.response.data as { message?: string | string[] } | undefined
    const raw = data?.message
    // NestJS devuelve message como string[] cuando falla class-validator.
    const message = Array.isArray(raw) ? raw.join(". ") : raw

    return new ApiError(message ?? `Error ${error.response.status}`, error.response.status)
  }

  return new NetworkError("Ocurrió un error inesperado")
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message
}
