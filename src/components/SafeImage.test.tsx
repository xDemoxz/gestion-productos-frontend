import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { SafeImage } from "./SafeImage"

describe("SafeImage", () => {
  it("muestra el placeholder cuando no hay src", () => {
    render(<SafeImage alt="Producto sin foto" />)
    expect(screen.getByRole("img", { name: "Producto sin foto" })).toHaveTextContent("Sin imagen")
  })

  it("renderiza la imagen cuando el src es válido", () => {
    render(<SafeImage src="https://example.com/foto.jpg" alt="Audífonos" />)
    expect(screen.getByAltText("Audífonos")).toHaveAttribute("src", "https://example.com/foto.jpg")
  })

  it("cae al placeholder si la imagen falla al cargar", () => {
    render(<SafeImage src="https://example.com/rota.jpg" alt="Rota" />)
    fireEvent.error(screen.getByAltText("Rota"))
    expect(screen.getByRole("img", { name: "Rota" })).toHaveTextContent("Sin imagen")
  })
})
