"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Search, Plus, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface User {
  id: string
  username: string | null // Se usa como "Email" visible
  full_name: string | null
  is_admin: boolean
  updated_at: string | null
}

const createUserSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  full_name: z.string().trim().min(1, "El nombre es requerido.").max(120, "Máximo 120 caracteres."),
  username: z.string().email("Debe ser un email válido.").optional(),
  password: z.string().min(6, "Mínimo 6 caracteres.").optional(),
  is_admin: z.boolean().default(false),
})

type CreateUserInput = z.infer<typeof createUserSchema>

const editUserSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  full_name: z.string().trim().min(1, "El nombre es requerido.").max(120, "Máximo 120 caracteres."),
  is_admin: z.boolean().default(false),
})

type EditUserInput = z.infer<typeof editUserSchema>

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const filteredUsers = useMemo(() => users, [users])

  useEffect(() => {
    fetchUsers()
  }, [searchTerm])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      const response = await fetch(`/api/users${query}`, { cache: "no-store" })

      if (!response.ok) {
        let errorDetail = `Error del servidor: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorDetail = errorData.detail || JSON.stringify(errorData)
        } catch {
          try {
            const textError = await response.text()
            if (textError) errorDetail = textError.substring(0, 100) + "..."
          } catch {}
        }
        throw new Error(errorDetail)
      }

      const data: User[] = await response.json()
      setUsers(data)
    } catch (err: unknown) {
      let finalErrorMessage = "Ocurrió un error inesperado al contactar al servidor."
      if (err instanceof Error) finalErrorMessage = err.message
      else if (typeof err === "string") finalErrorMessage = err

      console.error("Error detallado al cargar usuarios:", err)
      setError(`Error al cargar usuarios: ${finalErrorMessage}`)
      toast({
        title: "Error de Carga",
        description: finalErrorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: !currentIsAdmin }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al actualizar el rol del usuario.")
      }

      toast({
        title: "Éxito",
        description: `Rol de usuario actualizado correctamente.`,
      })
      fetchUsers()
    } catch (err: any) {
      console.error("Error al actualizar rol:", err)
      toast({
        title: "Error",
        description: `No se pudo actualizar el rol del usuario: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  // Crear usuario
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate, isSubmitting: isCreating },
    reset: resetCreate,
    watch: watchCreate,
    setValue: setValueCreate,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      username: "",
      password: "",
      is_admin: false,
    },
  })

  const onSubmitCreate = async (values: CreateUserInput) => {
    try {
      const payload = {
        email: values.email,
        full_name: values.full_name,
        username: values.username ? values.username : values.email,
        password: values.password || undefined,
        is_admin: values.is_admin,
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "No se pudo crear el usuario.")
      }
      toast({ title: "Usuario creado", description: "El usuario fue creado correctamente." })
      setOpenCreate(false)
      resetCreate()
      fetchUsers()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Fallo al crear el usuario.", variant: "destructive" })
    }
  }

  // Editar usuario
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit, isSubmitting: isEditing },
    reset: resetEdit,
    setValue: setValueEdit,
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      is_admin: false,
    },
  })

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    resetEdit({
      email: user.username || "",
      full_name: user.full_name || "",
      is_admin: user.is_admin,
    })
    setOpenEdit(true)
  }

  const onSubmitEdit = async (values: EditUserInput) => {
    if (!editingUser) return
    try {
      const payload: any = {
        full_name: values.full_name,
        username: values.email, // mantenemos username como email visible
        is_admin: values.is_admin,
      }
      // También permitimos actualizar email de Auth si cambió
      if ((editingUser.username || "") !== values.email) {
        payload.email = values.email
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "No se pudo actualizar el usuario.")
      }
      toast({ title: "Usuario actualizado", description: "Los cambios se han guardado correctamente." })
      setOpenEdit(false)
      setEditingUser(null)
      fetchUsers()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Fallo al actualizar el usuario.", variant: "destructive" })
    }
  }

  if (loading && !users.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-100">
        <p>Cargando usuarios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Card className="bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Usuarios</CardTitle>
              <CardDescription className="text-gray-400">
                Lista de todos los usuarios registrados en el sistema y sus roles.
              </CardDescription>
            </div>
            <Button onClick={() => setOpenCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Buscar por email o nombre completo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Nombre Completo</TableHead>
                  <TableHead className="text-gray-300">Rol</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">{user.username || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{user.full_name || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.is_admin ? "bg-purple-600 text-purple-50" : "bg-blue-600 text-blue-50"
                        }`}
                      >
                        {user.is_admin ? "Administrador" : "Usuario"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-50">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-700 border border-gray-600 text-gray-100">
                          <DropdownMenuItem
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            {user.is_admin ? "Degradar a Usuario" : "Promover a Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                            className="hover:bg-gray-600 focus:bg-gray-600 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
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

      {/* Diálogo: Crear Usuario */}
      <Dialog open={openCreate} onOpenChange={(o) => (!isCreating ? setOpenCreate(o) : null)}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="usuario@correo.com"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerCreate("email")}
                onBlur={(e) => {
                  // Prellenar username si está vacío
                  const val = e.currentTarget.value
                  if (!watchCreate("username")) setValueCreate("username", val)
                }}
              />
              {errorsCreate.email && <p className="text-red-400 text-sm">{errorsCreate.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Nombre y apellido"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerCreate("full_name")}
              />
              {errorsCreate.full_name && <p className="text-red-400 text-sm">{errorsCreate.full_name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Usuario (email visible)</Label>
              <Input
                id="username"
                placeholder="usuario@correo.com"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerCreate("username")}
              />
              {errorsCreate.username && <p className="text-red-400 text-sm">{errorsCreate.username.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres, o deja vacío para enviar invitación"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerCreate("password")}
              />
              {errorsCreate.password && <p className="text-red-400 text-sm">{errorsCreate.password.message}</p>}
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Switch id="is_admin" {...registerCreate("is_admin")} />
                <Label htmlFor="is_admin">Administrador</Label>
              </div>
              <div className="text-xs text-gray-400">
                Sin contraseña: se enviará invitación por email automáticamente.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700">
                {isCreating ? "Creando..." : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Editar Usuario */}
      <Dialog open={openEdit} onOpenChange={(o) => (!isEditing ? setOpenEdit(o) : null)}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email_edit">Email</Label>
              <Input
                id="email_edit"
                placeholder="usuario@correo.com"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerEdit("email")}
              />
              {errorsEdit.email && <p className="text-red-400 text-sm">{errorsEdit.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name_edit">Nombre completo</Label>
              <Input
                id="full_name_edit"
                placeholder="Nombre y apellido"
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                {...registerEdit("full_name")}
              />
              {errorsEdit.full_name && <p className="text-red-400 text-sm">{errorsEdit.full_name.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Switch id="is_admin_edit" {...registerEdit("is_admin")} />
              <Label htmlFor="is_admin_edit">Administrador</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenEdit(false)
                  setEditingUser(null)
                }}
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditing} className="bg-blue-600 hover:bg-blue-700">
                {isEditing ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
