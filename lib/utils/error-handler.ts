/**
 * Extracts a readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }

  return "Ha ocurrido un error inesperado. Por favor, intenta nuevamente."
}

/**
 * Handles API errors with context and returns formatted error info
 */
export function handleApiError(error: unknown, context: string) {
  const message = getErrorMessage(error)
  console.error(`[${context}]`, error)

  return {
    title: `Error en ${context}`,
    description: message,
    action: "Reintentar",
  }
}

/**
 * Formats Supabase errors for user display
 */
export function formatSupabaseError(error: any): string {
  if (!error) return "Error desconocido"

  // Common Supabase error codes
  const errorMessages: Record<string, string> = {
    "23505": "Este registro ya existe en el sistema",
    "23503": "No se puede eliminar porque tiene registros relacionados",
    "42501": "No tienes permisos para realizar esta acción",
    PGRST116: "No se encontró el registro solicitado",
  }

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code]
  }

  return error.message || "Error en la base de datos"
}
