// -----------------------------------------------------------------------------
// 📁 app/(dashboard)/dashboard/users/page.tsx
// UsersPage — ahora la base de usuarios proviene de `public.profiles` (id = auth.users.id)
// Se enriquece con `public.enhanced_profiles` (datos personales + role_id) y `public.user_roles`.
// -----------------------------------------------------------------------------
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, UserPlus, Search, MoreHorizontal, Shield, User, Edit, Trash2, Settings } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos alineados a `profiles` + `enhanced_profiles` + `user_roles`
// ─────────────────────────────────────────────────────────────────────────────
interface UserRole { id: string; name: string; description?: string }

interface AppUser {
  id: string // = profiles.id = auth.users.id
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  website?: string | null
  is_admin: boolean
  updated_at?: string | null // profiles.updated_at

  // Campos enriquecidos (enhanced_profiles)
  first_name?: string | null
  last_name?: string | null
  dni?: string | null
  phone?: string | null
  address?: string | null
  is_active: boolean
  role_id?: string | null
  role?: UserRole | null
  enriched_updated_at?: string | null
}

interface Role { id: string; name: string; description?: string }
interface Permission { id: string; route_path: string }

const AVAILABLE_ROUTES = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/clients", label: "Clientes" },
  { path: "/dashboard/loans", label: "Préstamos" },
  { path: "/dashboard/receipts", label: "Recibos" },
  { path: "/dashboard/users", label: "Usuarios" },
  { path: "/dashboard/partners", label: "Socios" },
  { path: "/dashboard/transactions", label: "Transacciones" },
  { path: "/dashboard/schedule", label: "Cronograma" },
  { path: "/dashboard/tracking", label: "Seguimientos" },
  { path: "/dashboard/reports", label: "Informes" },
  { path: "/dashboard/formulas", label: "Fórmulas" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    address: "",
    role_id: "",
    is_active: true,
  })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar usuarios")
      setUsers(data.users || [])
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error de conexión", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles")
      const data = await res.json()
      if (res.ok) setRoles(data.roles || [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchUserPermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`)
      const data = await response.json()
      if (response.ok) {
        setUserPermissions((data.permissions || []).map((p: Permission) => p.route_path))
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleCreateUser = async () => {
    // NOTA: no se crean filas en `profiles` desde aquí.
    // Este flujo hace UPSERT en `enhanced_profiles` para un user existente (profiles.id)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear/adjuntar perfil")
      setUsers((prev) => [data.user, ...prev])
      setIsCreateDialogOpen(false)
      resetForm()
      toast({ title: "Éxito", description: "Perfil enriquecido creado/actualizado" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error de conexión", variant: "destructive" })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar usuario")
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? data.user : u)))
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      toast({ title: "Éxito", description: "Usuario actualizado correctamente" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error de conexión", variant: "destructive" })
    }
  }

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_paths: userPermissions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar permisos")
      setIsPermissionsDialogOpen(false)
      setSelectedUser(null)
      setUserPermissions([])
      toast({ title: "Éxito", description: "Permisos actualizados correctamente" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error de conexión", variant: "destructive" })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al desactivar usuario")
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u)))
      toast({ title: "Éxito", description: "Usuario desactivado correctamente" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error de conexión", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ first_name: "", last_name: "", dni: "", phone: "", address: "", role_id: "", is_active: true })
  }

  const openEditDialog = (user: AppUser) => {
    setSelectedUser(user)
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      dni: user.dni || "",
      phone: user.phone || "",
      address: user.address || "",
      role_id: user.role_id || "",
      is_active: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const openPermissionsDialog = async (user: AppUser) => {
    setSelectedUser(user)
    await fetchUserPermissions(user.id)
    setIsPermissionsDialogOpen(true)
  }

  const togglePermission = (routePath: string) => {
    setUserPermissions((prev) => (prev.includes(routePath) ? prev.filter((p) => p !== routePath) : [...prev, routePath]))
  }

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    return (
      (u.full_name || "").toLowerCase().includes(term) ||
      (u.username || "").toLowerCase().includes(term) ||
      (u.first_name || "").toLowerCase().includes(term) ||
      (u.last_name || "").toLowerCase().includes(term) ||
      (u.dni || "").includes(searchTerm)
    )
  })

  const activeUsers = users.filter((u) => u.is_active).length
  const totalUsers = users.length

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gestión de Usuarios" description="Cargando..." />
        <div className="text-center py-8">Cargando usuarios...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Usuarios" description="Administra los usuarios del sistema y sus permisos">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adjuntar/Crear Perfil Enriquecido</DialogTitle>
              <DialogDescription>
                Vincula datos personales y rol a un usuario existente (profiles.id)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="is_active">Usuario activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registrados en profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Con acceso habilitado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Disponibles</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">Roles configurados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Fuente: profiles + enhanced_profiles + roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar usuarios..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {users.length === 0 ? "No hay usuarios" : "Sin coincidencias"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{u.full_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`}</div>
                          <div className="text-sm text-muted-foreground">{u.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role?.name || "Sin rol"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.enriched_updated_at || u.updated_at || Date.now()).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(u)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPermissionsDialog(u)}><Settings className="mr-2 h-4 w-4" />Permisos</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u.id)}><Trash2 className="mr-2 h-4 w-4" />Desactivar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Actualiza datos enriquecidos y rol</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_first_name">Nombre</Label>
                <Input id="edit_first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_last_name">Apellido</Label>
                <Input id="edit_last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_dni">DNI</Label>
              <Input id="edit_dni" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_phone">Teléfono</Label>
              <Input id="edit_phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_address">Dirección</Label>
              <Input id="edit_address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_role">Rol</Label>
              <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit_is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label htmlFor="edit_is_active">Usuario activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditUser}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos</DialogTitle>
            <DialogDescription>
              Selecciona las páginas a las que {selectedUser?.full_name || `${selectedUser?.first_name ?? ""} ${selectedUser?.last_name ?? ""}`} puede acceder
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {AVAILABLE_ROUTES.map((route) => (
              <div key={route.path} className="flex items-center space-x-2">
                <Checkbox id={route.path} checked={userPermissions.includes(route.path)} onCheckedChange={() => togglePermission(route.path)} />
                <Label htmlFor={route.path} className="text-sm font-normal cursor-pointer">
                  {route.label}
                  <span className="text-xs text-muted-foreground ml-2">({route.path})</span>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePermissions}>Guardar Permisos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 📁 app/api/users/route.ts  (GET lista, POST upsert enhanced_profiles)
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  // Trae todos los profiles y LEFT JOIN a enhanced_profiles y roles
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, username, full_name, avatar_url, website, is_admin, updated_at,
      enhanced_profiles:enhanced_profiles!enhanced_profiles_id_fkey (
        first_name, last_name, phone, address, dni, is_active, role_id, updated_at
      ),
      user_roles:user_roles!enhanced_profiles_role_id_fkey(* )
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map a shape homogénea para el front
  const users = (data || []).map((r: any) => ({
    id: r.id,
    username: r.username,
    full_name: r.full_name,
    avatar_url: r.avatar_url,
    website: r.website,
    is_admin: r.is_admin,
    updated_at: r.updated_at,
    first_name: r.enhanced_profiles?.first_name ?? null,
    last_name: r.enhanced_profiles?.last_name ?? null,
    phone: r.enhanced_profiles?.phone ?? null,
    address: r.enhanced_profiles?.address ?? null,
    dni: r.enhanced_profiles?.dni ?? null,
    is_active: r.enhanced_profiles?.is_active ?? true,
    role_id: r.enhanced_profiles?.role_id ?? null,
    role: r.user_roles ? { id: r.user_roles.id, name: r.user_roles.name, description: r.user_roles.description } : null,
    enriched_updated_at: r.enhanced_profiles?.updated_at ?? null,
  }))

  return NextResponse.json({ users })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()
  // Espera: dni/first_name/last_name/phone/address/role_id/is_active
  // Requiere que el usuario ya exista en `profiles`. Para enlazar usamos dni o username/email externos.
  // ⚠️ Ajusta este selector a tu lógica real para identificar al usuario. Aquí ejemplo por dni o por email en profiles.website como fallback.

  const { dni, first_name, last_name, phone, address, role_id, is_active } = body

  // Busca el profile por dni en enhanced_profiles o crea el enriched para el primer profile disponible
  let targetUserId: string | null = null

  if (dni) {
    const { data: epByDni } = await supabase.from("enhanced_profiles").select("id").eq("dni", dni).maybeSingle()
    if (epByDni?.id) targetUserId = epByDni.id
  }

  if (!targetUserId) {
    // Como ejemplo, toma el primer profile sin enriched con ese dni (si existiese una relación externa)
    const { data: anyProfile } = await supabase.from("profiles").select("id").limit(1)
    if (anyProfile && anyProfile.length > 0) targetUserId = anyProfile[0].id
  }

  if (!targetUserId) return NextResponse.json({ error: "No se encontró usuario base en profiles" }, { status: 400 })

  const { data, error } = await supabase
    .from("enhanced_profiles")
    .upsert({
      id: targetUserId,
      first_name,
      last_name,
      phone,
      address,
      dni,
      role_id: role_id || null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select("*, user_roles:user_roles!enhanced_profiles_role_id_fkey(*)")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Devuelve el usuario combinado
  const { data: p } = await supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle()

  const user = {
    id: targetUserId,
    username: p?.username ?? null,
    full_name: p?.full_name ?? null,
    avatar_url: p?.avatar_url ?? null,
    website: p?.website ?? null,
    is_admin: p?.is_admin ?? false,
    updated_at: p?.updated_at ?? null,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    phone: data?.phone ?? null,
    address: data?.address ?? null,
    dni: data?.dni ?? null,
    is_active: data?.is_active ?? true,
    role_id: data?.role_id ?? null,
    role: data?.user_roles ? { id: data.user_roles.id, name: data.user_roles.name, description: data.user_roles.description } : null,
    enriched_updated_at: data?.updated_at ?? null,
  }

  return NextResponse.json({ user })
}

// -----------------------------------------------------------------------------
// 📁 app/api/users/[id]/route.ts  (PATCH actualizar enriched, DELETE desactivar)
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await _.json()
  const { first_name, last_name, phone, address, dni, role_id, is_active } = body

  const { data, error } = await supabase
    .from("enhanced_profiles")
    .upsert({
      id: params.id,
      first_name,
      last_name,
      phone,
      address,
      dni,
      role_id: role_id ?? null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select("*, user_roles:user_roles!enhanced_profiles_role_id_fkey(*)")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: p } = await supabase.from("profiles").select("*").eq("id", params.id).maybeSingle()

  const user = {
    id: params.id,
    username: p?.username ?? null,
    full_name: p?.full_name ?? null,
    avatar_url: p?.avatar_url ?? null,
    website: p?.website ?? null,
    is_admin: p?.is_admin ?? false,
    updated_at: p?.updated_at ?? null,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    phone: data?.phone ?? null,
    address: data?.address ?? null,
    dni: data?.dni ?? null,
    is_active: data?.is_active ?? true,
    role_id: data?.role_id ?? null,
    role: data?.user_roles ? { id: data.user_roles.id, name: data.user_roles.name, description: data.user_roles.description } : null,
    enriched_updated_at: data?.updated_at ?? null,
  }

  return NextResponse.json({ user })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { error } = await supabase
    .from("enhanced_profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// -----------------------------------------------------------------------------
// 📁 app/api/users/[id]/permissions/route.ts  (GET/POST permisos por user_id)
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase.from("user_permissions").select("id, route_path").eq("user_id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permissions: data || [] })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body = await req.json()
  const route_paths: string[] = body?.route_paths ?? []

  // Normaliza: borra actuales e inserta nuevos
  const { error: delErr } = await supabase.from("user_permissions").delete().eq("user_id", params.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (route_paths.length === 0) return NextResponse.json({ ok: true, permissions: [] })

  const rows = route_paths.map((rp) => ({ user_id: params.id, route_path: rp }))
  const { data, error } = await supabase.from("user_permissions").insert(rows).select("id, route_path")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, permissions: data })
}

// -----------------------------------------------------------------------------
// 📁 app/api/roles/route.ts  (GET roles)
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from("user_roles").select("id, name, description").order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roles: data || [] })
}

// -----------------------------------------------------------------------------
// ✅ Notas de implementación
// - La UI NO crea usuarios en `profiles`, sólo enriquece (`enhanced_profiles`) y asigna roles/permisos.
// - Asegúrate de tener creada la RLS/Policies para que tu service role pueda leer/escribir estas tablas.
// - Ajusta el selector de usuario en POST /api/users según tu lógica real (email, username, mapeo explícito).
// - Si ya tenés `enhanced_profiles` poblada por triggers, podés simplificar POST para exigir `id` explícito.
// -----------------------------------------------------------------------------
