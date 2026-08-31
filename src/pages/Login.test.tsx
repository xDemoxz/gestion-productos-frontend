import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import Login from "./Login"

const mockLogin = vi.fn()

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin })
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
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
    mockLogin.mockImplementation(() => {
      throw new Error("401")
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText("Correo"), "malo@example.com")
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta")
    await user.click(screen.getByRole("button", { name: "Ingresar" }))

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument()
  })
})
