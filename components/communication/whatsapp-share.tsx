"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface WhatsAppShareProps {
  phone?: string
  message: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function WhatsAppShare({ phone, message, variant = "outline", size = "sm", className }: WhatsAppShareProps) {
  const handleWhatsAppShare = () => {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = phone?.replace(/\D/g, "") || ""

    // Construir la URL de WhatsApp
    let whatsappUrl = "https://wa.me/"

    if (cleanPhone) {
      // Si hay teléfono, enviarlo directamente a ese número
      whatsappUrl += `${cleanPhone}?text=${encodeURIComponent(message)}`
    } else {
      // Si no hay teléfono, abrir WhatsApp con el mensaje para que el usuario elija el contacto
      whatsappUrl += `?text=${encodeURIComponent(message)}`
    }

    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, "_blank")
  }

  return (
    <Button variant={variant} size={size} onClick={handleWhatsAppShare} className={className}>
      <MessageCircle className="h-4 w-4 mr-2" />
      WhatsApp
    </Button>
  )
}
