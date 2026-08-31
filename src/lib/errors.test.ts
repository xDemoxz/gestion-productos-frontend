import { describe, expect, it } from "vitest"
import { AxiosError, AxiosHeaders } from "axios"
import { ApiError, NetworkError, toAppError } from "./errors"

function axiosErrorWithStatus(status: number, message?: string | string[]) {
  const error = new AxiosError("request failed")
  error.response = {
    status,
    statusText: "",
    data: message ? { message } : {},
    headers: {},
    config: { headers: new AxiosHeaders() }
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
    expect((result as ApiError).isAuth).toBe(false)
    expect(result.message).toBe("Ya existe una categoría con este nombre")
  })

  it("marca 401 y 403 como errores de autorización", () => {
    expect((toAppError(axiosErrorWithStatus(401)) as ApiError).isAuth).toBe(true)
    expect((toAppError(axiosErrorWithStatus(403)) as ApiError).isAuth).toBe(true)
  })

  it("une los mensajes de validación que NestJS envía como arreglo", () => {
    const result = toAppError(
      axiosErrorWithStatus(400, ["El correo no es válido", "La contraseña es muy corta"])
    )
    expect(result.message).toBe("El correo no es válido. La contraseña es muy corta")
  })
})
