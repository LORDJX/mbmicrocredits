// components/forms/create-client-form.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Importamos Camera para usarlo en la nueva sección de Documentación
import { Loader2, User, Phone, FileText, Camera } from "lucide-react" 
import { useToast } from "@/hooks/use-toast"
import { FileUploadInput } from "../file-upload-input" 
import { createClient } from '@/lib/supabase/client'; 
// NOTA: Si tienes un componente para la cámara, impórtalo aquí:
// import { CameraCaptureInput } from "../camera-capture-input"; 


interface CreateClientFormProps {
  onSuccess?: (client: any) => void
  onCancel?: () => void
}

const DNI_BUCKET = 'documentos-clientes'; 

export function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    email: "",
    address: "",
    referred_by: "",
    observations: "",
    status: "active",
    dni_photo_url: null as string | null, 
    dni_back_url: null as string | null,  
  })
  const { toast } = useToast()

  const handleInputChange = (field: keyof typeof formData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 1. VALIDACIÓN CRÍTICA DE FOTOS
    if (!formData.dni_photo_url || !formData.dni_back_url) {
        toast({
            title: "Error de Validación",
            description: "Debe adjuntar la foto del frente y el dorso del DNI antes de crear el cliente.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    // 2. PREPARAR EL PAYLOAD
    const payload = {
        ...formData,
        dni_photo_url: formData.dni_photo_url, 
        dni_back_url: formData.dni_back_url,
    };

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), 
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear cliente") 
      }

      toast({
        title: "Cliente creado",
        description: `Cliente ${data.client.first_name} ${data.client.last_name} creado exitosamente`,
      })

      onSuccess?.(data.client)
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nuevo Cliente
        </CardTitle>
        <CardDescription>Registra un nuevo cliente en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Ingresa el nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Ingresa el apellido"
                  required
                />
              </div>
            </div>
            
            {/* Input DNI */}
            <div className="space-y-2">
              <Label htmlFor="dni">
                DNI <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange("dni", e.target.value)}
                placeholder="Ingresa el DNI"
                required
              />
            </div>
            
          </div>

          {/* 2. Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Ingresa el teléfono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Ingresa el email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Ingresa la dirección completa"
              />
            </div>
          </div>

          {/* 3. Información Adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Información Adicional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referred_by">Referido por</Label>
                <Input
                  id="referred_by"
                  value={formData.referred_by}
                  onChange={(e) => handleInputChange("referred_by", e.target.value)}
                  placeholder="¿Quién lo refirió?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange("observations", e.target.value)}
                placeholder="Notas adicionales sobre el cliente"
                rows={3}
              />
            </div>
          </div>
          
          {/* 4. Subida de DNI (MOVEMOS AL FINAL - Nueva posición) */}
          <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Documentación (DNI)
              </h3>
              <p className="text-sm text-muted-foreground">Sube o toma una foto del frente y dorso del DNI. **(Requiere ambos)**</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DNI Frente */}
                  <FileUploadInput
                      label="DNI - Frente (Archivo o Cámara)"
                      bucket={DNI_BUCKET}
                      filePath={`${formData.dni || 'temp_dni'}_front_${Date.now()}.jpg`}
                      currentUrl={formData.dni_photo_url}
                      onUploadSuccess={(url) => handleInputChange("dni_photo_url", url)}
                      onRemove={() => handleInputChange("dni_photo_url", null)}
                      // Si quieres añadir la funcionalidad de cámara, necesitas envolver esto
                      // o tener un componente que maneje ambas lógicas (archivo y cámara).
                      // Por ahora, 'FileUploadInput' permite la subida desde el celular, que incluye la opción de cámara.
                  />
                  
                  {/* DNI Dorso */}
                  <FileUploadInput
                      label="DNI - Dorso (Archivo o Cámara)"
                      bucket={DNI_BUCKET}
                      filePath={`${formData.dni || 'temp_dni'}_back_${Date.now()}.jpg`}
                      currentUrl={formData.dni_back_url}
                      onUploadSuccess={(url) => handleInputChange("dni_back_url", url)}
                      onRemove={() => handleInputChange("dni_back_url", null)}
                  />
              </div>
              
              {/* Espacio para un componente de captura de cámara dedicado, si es necesario. */}
              {/* <div className="space-y-2">
                  <Label>O usa la cámara para capturar directamente:</Label>
                  <CameraCaptureInput 
                      onCaptureSuccess={(blob) => {
                          // Lógica para subir el blob a Supabase y actualizar el estado (ej: dni_photo_url)
                      }} 
                  />
              </div> */}

          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Crear Cliente
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
