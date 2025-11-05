export const formatDate = (
  date: string | Date, 
  format: 'short' | 'long' = 'short'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida'
    }
    
    if (format === 'long') {
      return dateObj.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha inválida'
  }
}

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida'
    }
    
    return dateObj.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return 'Fecha inválida'
  }
}
