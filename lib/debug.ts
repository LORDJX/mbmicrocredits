export function logDebug(message: string, data?: any) {
  if (typeof window === "undefined") {
    // Servidor
    console.log(`[SERVER DEBUG] ${message}`, data || "")
  } else {
    // Cliente
    console.log(`[CLIENT DEBUG] ${message}`, data || "")
  }
}

export function clearNextCache() {
  if (typeof window !== "undefined") {
    // Limpiar caché del cliente
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes("next")) {
            caches.delete(name)
          }
        })
      })
    }
  }
}

export function checkForServerActions() {
  logDebug("Verificando Server Actions en el cliente")

  // Verificar si hay formularios con action attributes problemáticos
  if (typeof document !== "undefined") {
    const forms = document.querySelectorAll("form[action]")
    if (forms.length > 0) {
      logDebug(
        `Encontrados ${forms.length} formularios con atributo action`,
        Array.from(forms).map((f) => f.getAttribute("action")),
      )
    } else {
      logDebug("No se encontraron formularios con atributo action problemático")
    }
  }
}
