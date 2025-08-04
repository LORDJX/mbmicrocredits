"use client"
import { useEffect, useState } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search } from "lucide-react" // Importar el icono de búsqueda
import { useToast } from "@/hooks/use-toast"

// Definición de tipos para un usuario
interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  first_name?: string // Añadido para la búsqueda
  last_name?: string // Añadido para la búsqueda
  dni?: string // Añadido para la búsqueda
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false)
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("") // Estado para el término de búsqueda
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [searchTerm]) // Volver a cargar usuarios cuando el término de búsqueda cambie

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      // Añadir el término de búsqueda como parámetro de consulta
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      const response = await fetch(`/api/users${query}`) // Usar la ruta de la API de Next.js
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al cargar usuarios: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al cargar usuarios: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }
      const data: User[] = await response.json()
      setUsers(data)
    } catch (err: any) {
      console.error("Error al cargar usuarios:", err.message)
      setError("Error al cargar usuarios: " + err.message)
      toast({
        title: "Error",
        description: `No se pudieron cargar los usuarios: ${err.message}`,
        variant: "destructive",
      })
      if (err.message.includes("permisos") || err.message.includes("403")) {
        router.push("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (userId: string) => {
    setCurrentUserId(userId)
    // Aquí podrías cargar los datos completos del usuario si el diálogo de edición lo necesita
    // Por ahora, solo abrimos el diálogo.
    setIsEditDialogOpen(true)
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_admin: !currentIsAdmin }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al actualizar el rol del usuario: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al actualizar el rol del usuario: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: `Rol de usuario actualizado correctamente a ${!currentIsAdmin ? "administrador" : "usuario"}.`,
      })
      fetchUsers() // Volver a cargar la lista para ver los cambios
    } catch (err: any) {
      console.error("Error al actualizar rol:", err.message)
      setError("Error al actualizar rol: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo actualizar el rol del usuario: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteUser = (userId: string) => {
    setUserToDeleteId(userId)
    setIsConfirmDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDeleteId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${userToDeleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Error al eliminar usuario: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch (jsonError) {
          errorMessage = `Error al eliminar usuario: ${response.status} ${response.statusText}. Respuesta no JSON: ${errorText.substring(0, 100)}...`
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Usuario eliminado (soft delete) correctamente.",
      })
      setIsConfirmDeleteDialogOpen(false)
      setUserToDeleteId(null)
      fetchUsers() // Volver a cargar la lista para ver los cambios
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err.message)
      setError("Error al eliminar usuario: " + err.message)
      toast({
        title: "Error",
        description: `No se pudo eliminar el usuario: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
          <CardTitle className="text-2xl font-bold text-gray-50">Gestión de Usuarios</CardTitle>
          <CardDescription className="text-gray-400">
            Lista de todos los usuarios registrados y sus roles.
          </CardDescription>
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o email..."
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
                  <TableHead className="text-gray-300">Nombre</TableHead>
                  <TableHead className="text-gray-300">Apellido</TableHead>
                  <TableHead className="text-gray-300">DNI</TableHead>
                  <TableHead className="text-gray-300">Rol</TableHead>
                  <TableHead className="text-gray-300">Estado</TableHead>
                  <TableHead className="text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-200">{user.email}</TableCell>
                    <TableCell className="text-gray-300">{user.first_name || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{user.last_name || "N/A"}</TableCell>
                    <TableCell className="text-gray-300">{user.dni || "N/A"}</TableCell>
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.deleted_at ? "bg-red-600 text-red-50" : "bg-green-600 text-green-50"
                        }`}
                      >
                        {user.deleted_at ? "Eliminado" : "Activo"}
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
                          {!user.deleted_at && (
                            <DropdownMenuItem
                              onClick={() => confirmDeleteUser(user.id)}
                              className="hover:bg-red-700 focus:bg-red-700 text-red-300 hover:text-red-50 focus:text-red-50 cursor-pointer"
                            >
                              Eliminar (Soft Delete)
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

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-50">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-gray-400">
              ¿Estás seguro de que quieres eliminar (soft delete) este usuario? Esta acción lo marcará como inactivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDeleteDialogOpen(false)}
              className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 hover:text-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-red-50 font-semibold"
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Confirmar Eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
