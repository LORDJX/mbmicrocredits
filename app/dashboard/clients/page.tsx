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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Search, PlusCircle, AlertCircle, Camera, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

interface FormErrors {
  first_name?: string
  last_name?: string
  dni?: string
  email?: string
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
  const form = new FormData()
  form.append("file", file)
  form.append("hint", hint)
  if (clientId) form.append("clientId", clientId)
  const res = await fetch("/api/upload", { method: "POST", body: form })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Error al subir imagen"))
  }
  const json = await res.json()
  return json.url as string
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
    if (!clientData.dni?.toString().trim()) errors.dni = "El DNI es obligatorio."
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
    if (!validateForm(newClient)) {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
      return
    }
    try {
      const payload: Record<string, any> = { ...newClient }

      // Subir imágenes si se eligieron
      if (newFrontFile) {
        payload.dni_front_url = await uploadImage(newFrontFile, "dni-front")
        payload.dni_photo_url = payload.dni_front_url // legacy opcional
      }
      if (newBackFile) {
        payload.dni_back_url = await uploadImage(newBackFile, "dni-back")
      }

      const response = await fetch("/api/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, "Error al crear cliente"))
      toast({ title: "Éxito", description: "Cliente creado correctamente." })
      setIsCreateDialogOpen(false)
      setNewClient(initialNewClientState)
      setFormErrors({})
      setNewFrontFile(null)
      setNewBackFile(null)
      fetchClients()
    } catch (err: any) {
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
    switch (cameraOpen.type) {
      case "new-front":
        setNewFrontFile(file)
        break
      case "new-back":
        setNewBackFile(file)
        break
      case "edit-front":
        setEditFrontFile(file)
        break
      case "edit-back":
        setEditBackFile(file)
        break
    }
    toast({
      title: "Foto capturada",
      description: "La imagen se ha capturado correctamente.",
    })
  }

  const openCamera = (type: typeof cameraOpen.type, title: string) => {
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
                  <TableHead>Referido por</TableHead>
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
                    <TableCell>{client.referred_by || "—"}</TableCell>
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

      {/* Diálogo de Edición */}
      {currentClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Actualiza los datos del cliente y guarda los cambios.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={currentClient.first_name || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>
              {formErrors.first_name && <p className="text-red-500 text-xs">{formErrors.first_name}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={currentClient.last_name || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>
              {formErrors.last_name && <p className="text-red-500 text-xs">{formErrors.last_name}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dni" className="text-right">
                  DNI
                </Label>
                <Input
                  id="dni"
                  name="dni"
                  value={currentClient.dni || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>
              {formErrors.dni && <p className="text-red-500 text-xs">{formErrors.dni}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={currentClient.email || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>
              {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={currentClient.phone || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Dirección
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={currentClient.address || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3"
                />
              </div>

              {/* Referido por (desplegable de clientes) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Referido por</Label>
                <div className="col-span-3">
                  <Select
                    value={currentClient.referred_by ?? undefined}
                    onValueChange={(val) =>
                      setCurrentClient((prev) => ({
                        ...(prev || {}),
                        referred_by: val === "__none__" ? undefined : val,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem key="none" value="__none__">
                        Ninguno
                      </SelectItem>
                      {clientsForReferrals.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observaciones (4 renglones) */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="observations" className="text-right mt-2">
                  Observaciones
                </Label>
                <textarea
                  id="observations"
                  name="observations"
                  rows={4}
                  value={currentClient.observations || ""}
                  onChange={(e) => handleInputChange(e, setCurrentClient)}
                  className="col-span-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Notas u observaciones del cliente..."
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Foto DNI frente</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setEditFrontFile(e.target.files?.[0] ?? null)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openCamera("edit-front", "Capturar DNI Frente")}
                    className="gap-1 px-3"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                {editFrontFile && (
                  <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                    Archivo seleccionado: {editFrontFile.name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Foto DNI reverso</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setEditBackFile(e.target.files?.[0] ?? null)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openCamera("edit-back", "Capturar DNI Reverso")}
                    className="gap-1 px-3"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                {editBackFile && (
                  <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                    Archivo seleccionado: {editBackFile.name}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Creación */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>Completa la información del nuevo cliente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_first_name" className="text-right">
                Nombre
              </Label>
              <Input
                id="new_first_name"
                name="first_name"
                value={newClient.first_name || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>
            {formErrors.first_name && <p className="text-red-500 text-xs">{formErrors.first_name}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_last_name" className="text-right">
                Apellido
              </Label>
              <Input
                id="new_last_name"
                name="last_name"
                value={newClient.last_name || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>
            {formErrors.last_name && <p className="text-red-500 text-xs">{formErrors.last_name}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_dni" className="text-right">
                DNI
              </Label>
              <Input
                id="new_dni"
                name="dni"
                value={newClient.dni || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>
            {formErrors.dni && <p className="text-red-500 text-xs">{formErrors.dni}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_email" className="text-right">
                Email
              </Label>
              <Input
                id="new_email"
                name="email"
                type="email"
                value={newClient.email || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>
            {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="new_phone"
                name="phone"
                value={newClient.phone || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_address" className="text-right">
                Dirección
              </Label>
              <Input
                id="new_address"
                name="address"
                value={newClient.address || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3"
              />
            </div>

            {/* Referido por (desplegable de clientes) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Referido por</Label>
              <div className="col-span-3">
                <Select
                  value={(newClient.referred_by as string | undefined) ?? undefined}
                  onValueChange={(val) =>
                    setNewClient((prev) => ({ ...(prev || {}), referred_by: val === "__none__" ? undefined : val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem key="none" value="__none__">
                      Ninguno
                    </SelectItem>
                    {clientsForReferrals.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observaciones (4 renglones) */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new_observations" className="text-right mt-2">
                Observaciones
              </Label>
              <textarea
                id="new_observations"
                name="observations"
                rows={4}
                value={newClient.observations || ""}
                onChange={(e) => handleInputChange(e, setNewClient)}
                className="col-span-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Notas u observaciones del cliente..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Foto DNI frente</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setNewFrontFile(e.target.files?.[0] ?? null)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCamera("new-front", "Capturar DNI Frente")}
                  className="gap-1 px-3"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {newFrontFile && (
                <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                  Archivo seleccionado: {newFrontFile.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Foto DNI reverso</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setNewBackFile(e.target.files?.[0] ?? null)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openCamera("new-back", "Capturar DNI Reverso")}
                  className="gap-1 px-3"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {newBackFile && (
                <div className="col-start-2 col-span-3 text-sm text-muted-foreground">
                  Archivo seleccionado: {newBackFile.name}
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setFormErrors({})
                  setNewClient(initialNewClientState)
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
        onClose={() => setCameraOpen((prev) => ({ ...prev, isOpen: false }))}
        onCapture={handleCameraCapture}
        title={cameraOpen.title}
      />
    </>
  )
}
