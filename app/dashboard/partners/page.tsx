import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Handshake, UserPlus, Search, MoreHorizontal, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

async function getPartnersData() {
  const supabase = await createClient()

  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const totalCapital = partners?.reduce((sum, partner) => sum + (Number(partner.capital) || 0), 0) || 0
  const totalWithdrawals = partners?.reduce((sum, partner) => sum + (Number(partner.withdrawals) || 0), 0) || 0
  const totalInterest = partners?.reduce((sum, partner) => sum + (Number(partner.generated_interest) || 0), 0) || 0

  return {
    partners: partners || [],
    totalPartners: partners?.length || 0,
    totalCapital,
    totalWithdrawals,
    totalInterest,
  }
}

export default async function PartnersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { partners, totalPartners, totalCapital, totalWithdrawals, totalInterest } = await getPartnersData()

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Socios" description="Administra los socios inversores y su capital">
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Socio
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total Socios" value={totalPartners} description="Socios activos" icon={Handshake} />
        <StatsCard
          title="Capital Total"
          value={`$${totalCapital.toLocaleString()}`}
          description="Invertido"
          icon={DollarSign}
        />
        <StatsCard
          title="Retiros"
          value={`$${totalWithdrawals.toLocaleString()}`}
          description="Total retirado"
          icon={TrendingDown}
        />
        <StatsCard
          title="Intereses"
          value={`$${totalInterest.toLocaleString()}`}
          description="Generados"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Socios</CardTitle>
          <CardDescription>Gestiona los socios inversores y su participación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar socios..." className="pl-10" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Retiros</TableHead>
                <TableHead>Intereses</TableHead>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay socios registrados
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Handshake className="h-4 w-4 text-primary" />
                        </div>
                        <div className="font-medium">{partner.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${Number(partner.capital || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground">${Number(partner.withdrawals || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">
                        ${Number(partner.generated_interest || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem>Registrar retiro</DropdownMenuItem>
                          <DropdownMenuItem>Editar capital</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar socio</DropdownMenuItem>
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
    </div>
  )
}
