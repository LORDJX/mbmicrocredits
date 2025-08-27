"use client"

import type React from "react"
import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, PlusCircle, AlertCircle, Camera, X, FileImage } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Client {
  id: string
  client_code: string
  last_name: string
  first_name: string
  dni: string | null
  address: string | null
  phone: string | null
  email: string | null
  referred_by: string | null
  status: string | null
  observations: string | null
  // legacy
  dni_photo_url: string | null
  // nuevas columnas
  dni_front_url: string | null
  dni_back_url: string | null
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  cbu_cvu: string | null
  alias: string | null
}

type PartialClient = Partial<Client>

const initialNewClientState: PartialClient = {
  first_name: "",
  last_name: "",
  dni: "",
  address: "",
  phone: "",
  email: "",
  referred_by: "",
  status: "activo",
  observations: "",
  dni_front_url: null,
  dni_back_url: null,
  cbu_cvu: "",
  alias: "",
}

interface FormErrors {
  first_name?: string
  last_name?: string
  dni?: string
  email?: string
  cbu_cvu?: string
}

const getErrorMessage = async (response: Response, defaultMessage: string): Promise<string> => {
  if (response.ok) return defaultMessage
  const errorText = await response.text()
  try {
    const errorJson = JSON.parse(errorText)
    return errorJson.detail || `${defaultMessage}: ${response.status} ${response.statusText}`
  } catch {
    return `${defaultMessage}: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 150)}...`
  }
}

async function uploadImage(file: File, hint: string, clientId?: string): Promise<string> {
  console.log("[v0] Iniciando subida de imagen:", { fileName: file.name, size: file.size, hint, clientId })

  try {
    const form = new FormData()
    form.append("file", file)
    form.append("hint", hint)
    if (clientId) form.append("clientId", clientId)

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[v0] Error en respuesta de upload:", res.status, errorText)
      throw new Error(`Error al subir imagen: ${res.status} - ${errorText}`)
    }

    const json = await res.json()
    console.log("[v0] Imagen subida exitosamente:", json.url)
    return json.url as string
  } catch (error) {
    console.error("[v0] Error en uploadImage:", error)
    throw error
  }
}

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title: string
}

function CameraCapture({ isOpen, onClose, onCapture, title }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a blob y crear archivo
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `dni-${Date.now()}.jpg`, { type: "image/jpeg" })
          onCapture(file)
          onClose()
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>Posiciona el DNI dentro del marco y presiona capturar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="text-center p-8 text-destructive">
              <AlertCircle className="mx-auto h-12 w-12 mb-4" />
              <p>{error}</p>
              <Button onClick={startCamera} className="mt-4">
                Intentar de nuevo
              </Button>
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          {!error && (
            <Button onClick={capturePhoto}>
              <Camera className="h-4 w-4 mr-2" />
              Capturar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<PartialClient | null>(null)
  const [newClient, setNewClient] = useState<PartialClient>(initialNewClientState)
  const [searchTerm, setSearchTerm] = useState("")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const { toast } = useToast()
  const router = useRouter()

  // Archivos de fotos (creación)
  const [newFrontFile, setNewFrontFile] = useState<File | null>(null)
  const [newBackFile, setNewBackFile] = useState<File | null>(null)
  // Archivos de fotos (edición)
  const [editFrontFile, setEditFrontFile] = useState<File | null>(null)
  const [editBackFile, setEditBackFile] = useState<File | null>(null)

  const [cameraOpen, setCameraOpen] = useState<{
    isOpen: boolean
    type: "new-front" | "new-back" | "edit-front" | "edit-back"
    title: string
  }>({
    isOpen: false,
    type: "new-front",
    title: "",
  })

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = searchTerm ? `/api/clients/?search=${encodeURIComponent(searchTerm)}` : "/api/clients/"
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Error al cargar clientes"))
      }
      const data: Client[] = await response.json()
      setClients(data)
    } catch (err: any) {
      console.error("Error detallado al cargar clientes:", err)
      setError(err.message)
      toast({
        title: "Error de Carga",
        description: err.message,
        variant: "destructive",
      })
      if (err.message.includes("permisos") || err.message.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const validateForm = (clientData: PartialClient): boolean => {
    const errors: FormErrors = {}
    if (!clientData.first_name?.toString().trim()) errors.first_name = "El nombre es obligatorio."
    if (!clientData.last_name?.toString().trim()) errors.last_name = "El apellido es obligatorio."
    const dni = clientData.dni?.toString().trim()
    if (!dni) {
      errors.dni = "El DNI es obligatorio."
    } else if (!/^\d{7,8}$/.test(dni)) {
      errors.dni = "El DNI debe contener solo números (7 u 8 dígitos)."
    }
    if (clientData.email && !/\S+@\S+\.\S+/.test(String(clientData.email)))
      errors.email = "Correo electrónico inválido."
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditClick = (client: Client) => {
    setCurrentClient(client)
    setFormErrors({})
    setEditFrontFile(null)
    setEditBackFile(null)
    setIsEditDialogOpen(true)
  }

  const handleDetailClick = (client: Client) => {
    setCurrentClient(client)
    setIsDetailDialogOpen(true)
  }

  const getReferredByName = (referredById: string | null): string => {
    if (!referredById) return "No especificado"
    const referredClient = clients.find((c) => c.id === referredById)
    return referredClient
      ? `${referredClient.first_name} ${referredClient.last_name} (${referredClient.client_code})`
      : "Cliente no encontrado"
  }

  const handlePrintClient = (client: Client) => {
    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        alert("No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.")
        return
      }

      const referredByName = getReferredByName(client.referred_by)

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalle del Cliente - ${client.first_name} ${client.last_name}</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: white;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #1e40af; 
                padding-bottom: 20px; 
              }
              .header h1 { 
                color: #1e40af; 
                font-size: 28px; 
                margin-bottom: 10px; 
              }
              .header p { 
                color: #666; 
                font-size: 16px; 
              }
              .section { 
                margin-bottom: 25px; 
                padding: 20px; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px; 
                background: #f9fafb; 
              }
              .section h3 { 
                color: #1e40af; 
                font-size: 18px; 
                margin-bottom: 15px; 
                border-bottom: 1px solid #d1d5db; 
                padding-bottom: 5px; 
              }
              .info-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; 
              }
              .info-item { 
                display: flex; 
                flex-direction: column; 
              }
              .info-label { 
                font-weight: 600; 
                color: #374151; 
                font-size: 14px; 
                margin-bottom: 5px; 
              }
              .info-value { 
                color: #111827; 
                font-size: 16px; 
              }
              .photo-container { 
                text-align: center; 
                margin-top: 15px; 
              }
              .photo-title { 
                font-weight: 600; 
                margin-bottom: 10px; 
                color: #374151; 
              }
              .photo-img { 
                max-width: 100%; 
                max-height: 300px; 
                border: 2px solid #d1d5db; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
              }
              .no-photo { 
                padding: 40px; 
                background: #f3f4f6; 
                border: 2px dashed #d1d5db; 
                border-radius: 8px; 
                color: #6b7280; 
                font-style: italic; 
              }
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #6b7280; 
                border-top: 1px solid #e5e7eb; 
                padding-top: 20px; 
              }
              @media print {
                body { padding: 10px; }
                .section { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Detalle del Cliente</h1>
              <p>BM Microcréditos - Sistema de Gestión</p>
            </div>

            <div class="section">
              <h3>Información Personal</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Código de Cliente</span>
                  <span class="info-value">${client.client_code || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Nombre Completo</span>
                  <span class="info-value">${client.first_name} ${client.last_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">DNI</span>
                  <span class="info-value">${client.dni}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Teléfono</span>
                  <span class="info-value">${client.phone || "No especificado"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${client.email || "No especificado"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Dirección</span>
                  <span class="info-value">${client.address || "No especificada"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Estado</span>
                  <span class="info-value">${client.status || "Activo"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Referido por</span>
                  <span class="info-value">${referredByName || "No especificado"}</span>
                </div>
              </div>
              ${
                client.observations
                  ? `
                <div style="margin-top: 15px;">
                  <span class="info-label">Observaciones</span>
                  <div style="margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #d1d5db;">
                    ${client.observations}
                  </div>
                </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <h3>Documentación DNI</h3>
              <div class="photo-container">
                <div class="photo-title">Documento Nacional de Identidad</div>
                ${
                  client.dni_photo_url
                    ? `<img src="${client.dni_photo_url}" alt="DNI" class="photo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                       <div class="no-photo" style="display: none;">Error al cargar la imagen del DNI</div>`
                    : '<div class="no-photo">Sin imagen del DNI</div>'
                }
              </div>
            </div>

            <div class="footer">
              <p>Documento generado el ${new Date().toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p>BM Microcréditos - Sistema de Gestión de Clientes</p>
            </div>
          </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()

      // Esperar a que se cargue el contenido antes de imprimir
      setTimeout(() => {
        try {
          printWindow.print()
        } catch (error) {
          console.error("[v0] Error al imprimir:", error)
          alert("Error al imprimir el documento. Intenta nuevamente.")
        }
      }, 1000)
    } catch (error) {
      console.error("[v0] Error en handlePrintClient:", error)
      alert("Error al generar el documento para impresión.")
    }
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClient || !validateForm(currentClient)) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }
    try {
      // Subir imágenes si fueron seleccionadas
      const payload: Record<string, any> = { ...currentClient }
      if (editFrontFile) {
        payload.dni_front_url = await uploadImage(editFrontFile, "dni-front", currentClient.id)
        // opcional: mantener legacy
        payload.dni_photo_url = payload.dni_front_url
      }
      if (editBackFile) {
        payload.dni_back_url = await uploadImage(editBackFile, "dni-back", currentClient.id)
      }

      const response = await fetch(`/api/clients/${currentClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, "Error al actualizar cliente"))
      toast({ title: "Éxito", description: "Cliente actualizado correctamente." })
      setIsEditDialogOpen(false)
      fetchClients()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Iniciando creación de cliente:", newClient)

    if (!validateForm(newClient)) {
      console.log("[v0] Validación fallida:", formErrors)
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] Verificando DNI duplicado:", newClient.dni)
      const dniCheckResponse = await fetch(`/api/clients?dni=${newClient.dni}`)
      if (dniCheckResponse.ok) {
        const existingClients = await dniCheckResponse.json()
        if (existingClients.length > 0) {
          console.log("[v0] DNI duplicado encontrado")
          toast({
            title: "DNI duplicado",
            description: "Ya existe un cliente con este DNI.",
            variant: "destructive",
          })
          return
        }
      }
    } catch (error) {
      console.error("[v0] Error verificando DNI:", error)
    }

    try {
      const payload: Record<string, any> = { ...newClient }

      // Subir imágenes si se eligieron
      if (newFrontFile) {
        console.log("[v0] Subiendo imagen frontal del DNI")
        payload.dni_front_url = await uploadImage(newFrontFile, "dni-front")
        payload.dni_photo_url = payload.dni_front_url // legacy opcional
      }
      if (newBackFile) {
        console.log("[v0] Subiendo imagen trasera del DNI")
        payload.dni_back_url = await uploadImage(newBackFile, "dni-back")
      }

      console.log("[v0] Enviando payload a API:", payload)

      const response = await fetch("/api/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Respuesta de API:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error de API:", errorText)
        throw new Error(await getErrorMessage(response, "Error al crear cliente"))
      }

      const createdClient = await response.json()
      console.log("[v0] Cliente creado exitosamente:", createdClient)

      toast({ title: "Éxito", description: "Cliente creado correctamente." })
      setIsCreateDialogOpen(false)
      setNewClient(initialNewClientState)
      setFormErrors({})
      setNewFrontFile(null)
      setNewBackFile(null)
      fetchClients()
    } catch (err: any) {
      console.error("[v0] Error final en creación de cliente:", err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<any>>,
  ) => {
    const { name, value } = e.target
    setter((prev: any) => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, "Error al eliminar cliente"))
      toast({ title: "Éxito", description: "Cliente eliminado correctamente." })
      fetchClients()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleCameraCapture = (file: File) => {
    console.log("[v0] Imagen capturada desde cámara:", file.name, file.size)

    try {
      if (cameraOpen.type === "new-front") {
        setNewFrontFile(file)
        console.log("[v0] Imagen frontal asignada para nuevo cliente")
      } else if (cameraOpen.type === "new-back") {
        setNewBackFile(file)
        console.log("[v0] Imagen trasera asignada para nuevo cliente")
      } else if (cameraOpen.type === "edit-front") {
        setEditFrontFile(file)
        console.log("[v0] Imagen frontal asignada para edición")
      } else if (cameraOpen.type === "edit-back") {
        setEditBackFile(file)
        console.log("[v0] Imagen trasera asignada para edición")
      }

      setCameraOpen({ isOpen: false, type: "new-front", title: "" })
    } catch (error) {
      console.error("[v0] Error al manejar captura de cámara:", error)
    }
  }

  const openCamera = (type: typeof cameraOpen.type, title: string) => {
    console.log("[v0] Abriendo cámara:", type, title)
    setCameraOpen({ isOpen: true, type, title })
  }

  const clientsForReferrals = useMemo(
    () => clients.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}`.trim() || c.client_code })),
    [clients],
  )

  if (loading && clients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Cargando clientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive-foreground bg-destructive/10 rounded-lg p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-bold">Error al Cargar los Datos</h2>
          <p className="mt-2 text-sm">{error}</p>
          <Button onClick={fetchClients} className="mt-6">
            Intentar de Nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="bg-card text-card-foreground border-border shadow-lg transition-all hover:shadow-primary/10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Gestión de Clientes</CardTitle>
              <CardDescription className="text-muted-foreground">
                Busca, crea y administra la información de tus clientes.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setIsCreateDialogOpen(true)
                setFormErrors({})
                setNewFrontFile(null)
                setNewBackFile(null)
              }}
              className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground font-semibold shadow-md transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 pl-10 focus:shadow-inner focus:shadow-primary/10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Referido por</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-secondary/50">
                    <TableCell className="font-mono text-xs">{client.client_code}</TableCell>
                    <TableCell className="font-medium">
                      {client.first_name} {client.last_name}
                    </TableCell>
                    <TableCell>{client.dni || "N/A"}</TableCell>
                    <TableCell>{client.phone || "N/A"}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell className="text-center">{getReferredByName(client.referred_by)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          client.deleted_at ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {client.deleted_at ? "Eliminado" : "Activo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                          <DropdownMenuItem
                            onClick={() => handleDetailClick(client)}
                            className="cursor-pointer hover:!bg-primary/10"
                          >
                            Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(client)}
                            className="cursor-pointer hover:!bg-primary/10"
                          >
                            Editar
                          </DropdownMenuItem>
                          {!client.deleted_at && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClient(client.id)}
                              className="cursor-pointer text-red-400 hover:!bg-red-500/10 hover:!text-red-400"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {currentClient && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Detalle del Cliente</DialogTitle>
              <DialogDescription>
                Información completa de {currentClient.first_name} {currentClient.last_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Código de Cliente</Label>
                  <p className="text-lg font-mono bg-secondary/50 p-2 rounded">{currentClient.client_code}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Estado</Label>
                  <p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        currentClient.deleted_at ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {currentClient.deleted_at ? "Inactivo" : "Activo"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Nombre Completo</Label>
                  <p className="text-lg">
                    {currentClient.first_name} {currentClient.last_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">DNI</Label>
                  <p className="text-lg">{currentClient.dni || "No especificado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Teléfono</Label>
                  <p className="text-lg">{currentClient.phone || "No especificado"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                  <p className="text-lg">{currentClient.email || "No especificado"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Dirección</Label>
                <p className="text-lg">{currentClient.address || "No especificada"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Referido por</Label>
                <p className="text-lg">{currentClient.referred_by || "No especificado"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">CBU/CVU</Label>
                <p className="text-lg">{currentClient.cbu_cvu || "No especificado"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Alias</Label>
                <p className="text-lg">{currentClient.alias || "No especificado"}</p>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Observaciones</Label>
                <div className="bg-secondary/30 p-4 rounded-lg min-h-[80px]">
                  <p className="text-sm leading-relaxed">
                    {currentClient.observations || "Sin observaciones registradas"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-primary">Documentación</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">DNI - Documento</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      {currentClient.dni_photo_url ? (
                        <div className="space-y-2">
                          <img
                            src={currentClient.dni_photo_url || "/placeholder.svg"}
                            alt="DNI"
                            className="max-w-full h-48 object-cover rounded mx-auto border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(currentClient.dni_photo_url!, "_blank")}
                            onError={(e) => {
                              console.error("[v0] Error al cargar imagen:", currentClient.dni_photo_url)
                              e.currentTarget.style.display = "none"
                              e.currentTarget.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                          <div className="hidden h-48 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                              <p>Error al cargar la imagen</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 bg-transparent"
                                onClick={() => window.open(currentClient.dni_photo_url!, "_blank")}
                              >
                                Abrir en nueva ventana
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Haz clic en la imagen para verla en tamaño completo
                          </p>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <FileImage className="mx-auto h-12 w-12 mb-2 opacity-50" />
                            <p>Sin imagen del DNI</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Fecha de Creación</Label>
                  <p className="text-sm">
                    {new Date(currentClient.created_at || "").toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {currentClient.updated_at && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">Última Actualización</Label>
                    <p className="text-sm">
                      {new Date(currentClient.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handlePrintClient(currentClient as Client)} className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimir PDF
              </Button>
              <Button onClick={() => setIsDetailDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para crear cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>Completa la información del nuevo cliente</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={newClient.first_name}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  className={formErrors.first_name ? "border-destructive" : ""}
                />
                {formErrors.first_name && <p className="text-sm text-destructive">{formErrors.first_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={newClient.last_name}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  className={formErrors.last_name ? "border-destructive" : ""}
                />
                {formErrors.last_name && <p className="text-sm text-destructive">{formErrors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  name="dni"
                  value={newClient.dni}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  placeholder="Ej: 12345678"
                  className={formErrors.dni ? "border-destructive" : ""}
                />
                {formErrors.dni && <p className="text-sm text-destructive">{formErrors.dni}</p>}
                <p className="text-xs text-muted-foreground">Solo números, 7 u 8 dígitos, sin puntos ni espacios</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newClient.phone}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={newClient.address}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referred_by">Referido por</Label>
                <Select
                  value={newClient.referred_by || "__none__"}
                  onValueChange={(value) => {
                    const referredBy = value === "__none__" ? undefined : value
                    setNewClient((prev) => ({ ...prev, referred_by: referredBy }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguno</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.client_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  value={newClient.observations}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  rows={4}
                  placeholder="Ingresa observaciones adicionales..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cbu_cvu">CBU/CVU</Label>
                <Input
                  id="cbu_cvu"
                  name="cbu_cvu"
                  value={newClient.cbu_cvu || ""}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  placeholder="Ingrese CBU o CVU"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  name="alias"
                  value={newClient.alias || ""}
                  onChange={(e) => handleInputChange(e, setNewClient)}
                  placeholder="Ingrese alias bancario"
                />
              </div>
            </div>

            {/* Fotos DNI */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Fotos del DNI</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Foto DNI Frente</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          console.log("[v0] Archivo seleccionado desde input:", file.name)
                          setNewFrontFile(file)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCamera("new-front", "Capturar DNI Frente")}
                      className="px-3"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  {newFrontFile && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Archivo seleccionado: {newFrontFile.name}</p>
                      <div className="border rounded-lg p-2">
                        <img
                          src={URL.createObjectURL(newFrontFile) || "/placeholder.svg"}
                          alt="Preview DNI Frente"
                          className="max-w-full h-32 object-cover rounded mx-auto"
                          onError={(e) => {
                            console.error("[v0] Error al mostrar preview:", newFrontFile.name)
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        <div className="hidden text-center text-muted-foreground p-4">
                          <AlertCircle className="mx-auto h-6 w-6 mb-1" />
                          <p className="text-xs">Error al mostrar preview</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Foto DNI Reverso</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          console.log("[v0] Archivo seleccionado desde input:", file.name)
                          setNewBackFile(file)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCamera("new-back", "Capturar DNI Reverso")}
                      className="px-3"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  {newBackFile && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Archivo seleccionado: {newBackFile.name}</p>
                      <div className="border rounded-lg p-2">
                        <img
                          src={URL.createObjectURL(newBackFile) || "/placeholder.svg"}
                          alt="Preview DNI Reverso"
                          className="max-w-full h-32 object-cover rounded mx-auto"
                          onError={(e) => {
                            console.error("[v0] Error al mostrar preview:", newBackFile.name)
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        <div className="hidden text-center text-muted-foreground p-4">
                          <AlertCircle className="mx-auto h-6 w-6 mb-1" />
                          <p className="text-xs">Error al mostrar preview</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setNewClient(initialNewClientState)
                  setFormErrors({})
                  setNewFrontFile(null)
                  setNewBackFile(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear Cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CameraCapture
        isOpen={cameraOpen.isOpen}
        onClose={() => setCameraOpen({ isOpen: false, type: "new-front", title: "" })}
        onCapture={handleCameraCapture}
        title={cameraOpen.title || "Capturar Imagen"}
      />
    </>
  )
}
