export const API_BASE_URL = process.env.API_BASE_URL || ""

if (!API_BASE_URL && typeof window === "undefined") {
  // Aviso en servidor para facilitar debugging sin romper el build
  console.warn("API_BASE_URL no está definida. Configúrala en las variables de entorno del proyecto.")
}
