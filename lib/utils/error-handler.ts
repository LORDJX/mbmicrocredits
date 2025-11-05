export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
}

export interface ErrorInfo {
  title: string
  description: string
  action?: string
  variant: 'destructive' | 'default'
}

export function handleApiError(error: unknown, context: string): ErrorInfo {
  const message = getErrorMessage(error)
  console.error(`[${context}]`, error)
  
  if (message.includes('401') || message.includes('No autorizado')) {
    return {
      title: 'Sesión expirada',
      description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      action: 'Ir a Login',
      variant: 'destructive'
    }
  }
  
  if (message.includes('403') || message.includes('Acceso denegado')) {
    return {
      title: 'Acceso denegado',
      description: 'No tienes permisos para realizar esta acción.',
      variant: 'destructive'
    }
  }
  
  if (message.includes('404') || message.includes('No encontrado')) {
    return {
      title: 'No encontrado',
      description: `No se encontró el recurso solicitado en ${context}.`,
      action: 'Reintentar',
      variant: 'destructive'
    }
  }
  
  if (message.includes('Network') || message.includes('fetch')) {
    return {
      title: 'Error de conexión',
      description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      action: 'Reintentar',
      variant: 'destructive'
    }
  }
  
  return {
    title: `Error en ${context}`,
    description: message,
    action: 'Reintentar',
    variant: 'destructive'
  }
}
