"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, User, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import CreateUserForm from "@/components/forms/create-user-form"
import EditUserForm from "@/components/forms/edit-user-form"

interface UserRole {
  id: string
  name: string
  description: string
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  username: string | null
  is_admin: boolean
  is_active: boolean
  role_id: string | null
  phone: string | null
  dni: string | null
  created_at: string
  role?: UserRole
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [authError, setAuthError] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Función para cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true)
      setAuthError(false)
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para cookies
      })

      if (response.status === 401) {
        setAuthError(true)
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
  }, [])

  // Función para eliminar usuario
  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.status === 401) {
        setAuthError(true)
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        throw new Error('Error al eliminar usuario')
      }

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      })

      // Recargar la lista
      loadUsers()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  // Función para abrir el diálogo de edición
  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user)
    setIsEditOpen(true)
  }

  // Callback cuando se crea/edita un usuario exitosamente
  const handleSuccess = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setSelectedUser(null)
    loadUsers()
  }

  // Función para obtener el nombre completo
  const getFullName = (user: UserProfile) => {
    if (user.full_name) return user.full_name
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) return user.first_name
    if (user.username) return user.username
    return user.email
  }

  // Función para obtener el badge de rol
  const getRoleBadge = (user: UserProfile) => {
    if (user.is_admin) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Administrador
        </span>
      )
    }
    
    if (user.role?.name) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          <User className="mr-1 h-3 w-3" />
          {user.role.name}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
        Usuario
      </span>
    )
  }

  // Mostrar mensaje de error de autenticación
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Sesión expirada</h2>
          <p className="text-muted-foreground">
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
          </p>
          <Button onClick={() => router.push('/login')}>
            Ir a Login
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay usuarios registrados
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {getFullName(user)}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username || '-'}
                  </TableCell>
                  <TableCell>{getRoleBadge(user)}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm user={selectedUser} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
