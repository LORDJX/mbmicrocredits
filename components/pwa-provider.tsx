"use client"

import { useEffect } from "react"

export function PWAProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" })
          // console.log("Service Worker registrado")
        } catch (e) {
          console.warn("Fallo al registrar SW", e)
        }
      }
      register()
    }
  }, [])
  return null
}
