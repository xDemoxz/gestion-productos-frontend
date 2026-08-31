import axios from "axios"
import { tokenStorage } from "./tokenStorage"
//creacion de instancia de axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

//Intercepetor para la las solicitudes al backend
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

//401 no autenticado y 403 no autorizado, 40
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.remove()
      window.location.href = "/login"
    }
    return Promise.reject(error) //se usa promise por que es una respuesta externa que viene del backend
  }
)
