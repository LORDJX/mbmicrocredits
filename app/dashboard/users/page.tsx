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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CreateUserForm from "@/components/forms/create-user-form"
import EditUserForm from "@/components/forms/edit-user-form"

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  // Función para cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true)
      // ✅ CORRECCIÓN: Usar la API route de Next.js en lugar de Supabase directo
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

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
      })

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
  const handleEdit = (user: User) => {
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
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay usuarios registrados
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
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
