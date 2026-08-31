import { BrowserRouter, Routes, Route } from "react-router"
import Login from "../pages/Login"
import Register from "../pages/Register"
import ProductsPage from "../pages/ProductsPage"
import ProductDetailPage from "../pages/ProductDetailPage"
import ProductCreatePage from "../pages/ProductCreatePage"
import ProductEditPage from "../pages/ProductEditPage"
import FavoritesPage from "../pages/FavoritesPage"
import CategoriesPage from "../pages/CategoriesPage"
import { Layout } from "../components/Layout"
import { ProtectedRoute } from "./ProtectedRoute"

export function MainRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />

          <Route
            path="/categories"
            element={
              <ProtectedRoute requiredRole="admin">
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
