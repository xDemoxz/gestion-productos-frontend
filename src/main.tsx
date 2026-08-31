import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { MainRouter } from "./routes/router"
import { AuthProvider } from "./context/AuthContext"
import { ErrorBoundary } from "./components/ErrorBoundary"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
)
