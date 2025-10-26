"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, CreditCard, FileText } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  dni: string
  phone: string
  email: string
  address: string
  status: string
  dni_photo_url?: string
  dni_back_url?: string
  cbu_cvu?: string
  alias?: string
  referred_by?: string
  observations?: string
  created_at: string
  updated_at?: string
}

interface Loan {
  id: string
  loan_code: string
  amount: number
  installments: number
  status: string
  start_date: string
  end_date: string
  amount_to_repay: number
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadClientData(params.id as string)
    }
  }, [params.id])

  async function loadClientData(clientId: string) {
    try {
      setLoading(true)
      const supabase = createClient()

      // Cargar datos del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .is('deleted_at', null)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Cargar préstamos del cliente
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (loansError) throw loansError
      setLoans(loansData || [])
    } catch (error) {
      console.error('Error loading client:', error)
      toast.error('Error al cargar los datos del cliente')
      router.push('/clientes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cliente no encontrado</p>
          <Button onClick={() => router.push('/clientes')}>
            Volver a Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/clientes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-muted-foreground">{client.client_code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/clientes/${client.id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/prestamos/nuevo?clientId=${client.id}`)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Nuevo Préstamo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información Personal */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">DNI</label>
                  <p className="text-base text-foreground">{client.dni}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p className="text-base text-foreground capitalize">{client.status || 'Activo'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-base text-foreground">{client.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base text-foreground break-all">{client.email || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-base text-foreground">{client.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CBU/CVU</label>
                  <p className="text-base text-foreground font-mono">{client.cbu_cvu || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alias</label>
                  <p className="text-base text-foreground">{client.alias || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Referido por</label>
                  <p className="text-base text-foreground">{client.referred_by || 'N/A'}</p>
                </div>
                {client.observations && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Observaciones</label>
                    <p className="text-base text-foreground whitespace-pre-wrap">{client.observations}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documentación */}
          <Card>
            <CardHeader>
              <CardTitle>Documentación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {client.dni_photo_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      DNI - Frente
                    </label>
                    <div className="relative w-full aspect-[1.6/1] bg-muted rounded overflow-hidden">
                      <Image
                        src={client.dni_photo_url}
                        alt="DNI Frente"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                {client.dni_back_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      DNI - Dorso
                    </label>
                    <div className="relative w-full aspect-[1.6/1] bg-muted rounded overflow-hidden">
                      <Image
                        src={client.dni_back_url}
                        alt="DNI Dorso"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                {!client.dni_photo_url && !client.dni_back_url && (
                  <p className="text-sm text-muted-foreground">
                    No hay documentación cargada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Préstamos */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Préstamos</CardTitle>
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este cliente no tiene préstamos registrados
                </p>
              ) : (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{loan.loan_code}</p>
                        <p className="text-sm text-muted-foreground">
                          ${loan.amount.toLocaleString('es-AR')} - {loan.installments} cuotas
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(loan.start_date).toLocaleDateString('es-AR')} - {new Date(loan.end_date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            ${loan.amount_to_repay?.toLocaleString('es-AR') || '0'}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {loan.status}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/prestamos/${loan.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
