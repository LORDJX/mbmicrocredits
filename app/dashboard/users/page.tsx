// app/usuarios/page.tsx

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Search, Shield, Edit, Key } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateUserForm } from "@/components/forms/create-user-form"
import { UserPermissionsManager } from "@/components/user-permissions-manager"

interface UserRole {
  id: string
  name: string
  description: string | null
}

interface User {
  id: string
  first_name: string
  last_name: string
  dni: string
  phone: string | null
  address: string | null
  is_active: boolean
  updated_at: string
  role_id: string | null
  user_roles: UserRole | null
}

async function getUsers() {
  try {
    const supabase = await createClient()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.users || []
  } catch (e) {
    console.error("Error fetching users:", e)
    return []
  }
}

async function getRoles() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("name")
    
    if (error) {
      console.error("Error fetching roles:", error)
      return []
    }
    
    return data || []
  } catch (e) {
    console.error("Error fetching roles:", e)
    return []
  }
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  const users = await getUsers()
  const roles = await getRoles()

  const activeUsersCount = users.filter((u: User) => u.is_active).length
  const inactiveUsersCount = users.filter((u: User) => !u.is_active).length
  const adminsCount = users.filter((u: User) => u.user_roles?.name === 'Admin').length

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
          Activo
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          Inactivo
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Usuarios" description="Administra usuarios y sus permisos">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <CreateUserForm 
              roles={roles}
              onSuccess={() => window.location.reload()} 
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard 
          title="Total Usuarios" 
          value={users.length} 
          description="Registrados" 
          icon={Users} 
        />
        <StatsCard 
          title="Usuarios Activos" 
          value={activeUsersCount} 
          description="En el sistema" 
          icon={Users} 
        />
        <StatsCard
          title="Inactivos"
          value={inactiveUsersCount}
          description="Deshabilitados"
          icon={Users}
        />
        <StatsCard
          title="Administradores"
          value={adminsCount}
          description="Con permisos totales"
          icon={Shield}
        />
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Buscar Usuarios</CardTitle>
          <CardDescription>Encuentra usuarios por nombre, DNI o rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI..."
                className="pl-10 bg-input border-border"
              />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground font-work-sans">Lista de Usuarios</CardTitle>
          <CardDescription>Todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-card-foreground">Nombre</TableHead>
                  <TableHead className="text-card-foreground">DNI</TableHead>
                  <TableHead className="text-card-foreground">Teléfono</TableHead>
                  <TableHead className="text-card-foreground">Rol</TableHead>
                  <TableHead className="text-card-foreground">Estado</TableHead>
                  <TableHead className="text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div>
                        <div className="font-medium text-card-foreground">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.dni}</TableCell>
                    <TableCell className="text-sm">{user.phone || "-"}</TableCell>
                    <TableCell>
                      {user.user_roles ? (
                        <Badge variant="outline" className="font-normal">
                          {user.user_roles.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin rol</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Usuario</DialogTitle>
                            </DialogHeader>
                            <CreateUserForm 
                              user={user}
                              roles={roles}
                              onSuccess={() => window.location.reload()} 
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Key className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Permisos de {user.first_name} {user.last_name}
                              </DialogTitle>
                            </DialogHeader>
                            <UserPermissionsManager 
                              userId={user.id}
                              userName={`${user.first_name} ${user.last_name}`}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground">No hay usuarios</h3>
              <p className="text-muted-foreground">Comienza creando tu primer usuario</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
