"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, CheckCircle, XCircle, Clock, DollarSign, User, Calendar } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface LoanApplication {
  id: string
  client_id: string
  requested_amount: number
  purpose: string
  employment_status: string
  monthly_income: number
  existing_debts: number
  collateral_description: string
  status: "pending" | "under_review" | "approved" | "rejected"
  reviewed_by?: string
  review_notes?: string
  created_at: string
  updated_at: string
  clients: {
    id: string
    first_name: string
    last_name: string
    dni: string
    phone: string
    email: string
  }
  documents?: Document[]
}

interface Document {
  id: string
  document_type: string
  file_url: string
  file_name: string
  created_at: string
}

interface ApplicationFormData {
  requested_amount: string
  purpose: string
  employment_status: string
  monthly_income: string
  existing_debts: string
  collateral_description: string
}

export default function LoanApplicationsPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved")
  const [userRole, setUserRole] = useState<string>("")

  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    requested_amount: "",
    purpose: "",
    employment_status: "",
    monthly_income: "",
    existing_debts: "",
    collateral_description: "",
  })

  useEffect(() => {
    fetchApplications()
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("enhanced_profiles")
          .select("user_roles(name)")
          .eq("id", user.id)
          .single()

        setUserRole(profile?.user_roles?.name || "borrower")
      }
    } catch (error) {
      console.error("Error checking user role:", error)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("loan_applications")
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            dni,
            phone,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error("Error fetching applications:", error)
      toast.error("Error al cargar las solicitudes")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitApplication = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Debe iniciar sesión para enviar una solicitud")
        return
      }

      // Check if user has a client profile
      const { data: clientData } = await supabase.from("clients").select("id").eq("id", user.id).single()

      if (!clientData) {
        toast.error("Debe completar su perfil de cliente primero")
        return
      }

      const applicationData = {
        client_id: user.id,
        requested_amount: Number.parseFloat(applicationForm.requested_amount),
        purpose: applicationForm.purpose,
        employment_status: applicationForm.employment_status,
        monthly_income: Number.parseFloat(applicationForm.monthly_income),
        existing_debts: Number.parseFloat(applicationForm.existing_debts) || 0,
        collateral_description: applicationForm.collateral_description,
        status: "pending",
      }

      const { error } = await supabase.from("loan_applications").insert([applicationData])

      if (error) throw error

      toast.success("Solicitud enviada exitosamente")
      setIsNewApplicationModalOpen(false)
      setApplicationForm({
        requested_amount: "",
        purpose: "",
        employment_status: "",
        monthly_income: "",
        existing_debts: "",
        collateral_description: "",
      })
      fetchApplications()
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("Error al enviar la solicitud")
    }
  }

  const handleReviewApplication = async () => {
    if (!selectedApplication) return

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("loan_applications")
        .update({
          status: reviewStatus,
          reviewed_by: user?.id,
          review_notes: reviewNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id)

      if (error) throw error

      // Create notification for the applicant
      await supabase.from("notifications").insert([
        {
          user_id: selectedApplication.client_id,
          title: `Solicitud ${reviewStatus === "approved" ? "Aprobada" : "Rechazada"}`,
          message: `Su solicitud de préstamo por $${selectedApplication.requested_amount.toLocaleString()} ha sido ${reviewStatus === "approved" ? "aprobada" : "rechazada"}. ${reviewNotes}`,
          type: reviewStatus === "approved" ? "success" : "error",
        },
      ])

      toast.success(`Solicitud ${reviewStatus === "approved" ? "aprobada" : "rechazada"} exitosamente`)
      setIsReviewModalOpen(false)
      setReviewNotes("")
      fetchApplications()
    } catch (error) {
      console.error("Error reviewing application:", error)
      toast.error("Error al revisar la solicitud")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      under_review: { label: "En Revisión", variant: "default" as const, icon: Eye },
      approved: {
        label: "Aprobada",
        variant: "default" as const,
        icon: CheckCircle,
        className: "bg-green-100 text-green-800",
      },
      rejected: { label: "Rechazada", variant: "destructive" as const, icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AppHeader title="Solicitudes de Préstamo" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando solicitudes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <AppHeader title="Solicitudes de Préstamo" />
        {userRole === "borrower" && (
          <Button onClick={() => setIsNewApplicationModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {application.clients.first_name} {application.clients.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">DNI: {application.clients.dni}</p>
                </div>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-lg">{formatCurrency(application.requested_amount)}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>{application.employment_status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{formatDate(application.created_at)}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  <strong>Propósito:</strong> {application.purpose}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApplication(application)
                    setIsViewModalOpen(true)
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalles
                </Button>

                {(userRole === "admin" || userRole === "loan_officer") && application.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedApplication(application)
                      setIsReviewModalOpen(true)
                    }}
                  >
                    Revisar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay solicitudes</h3>
            <p className="text-muted-foreground mb-4">
              {userRole === "borrower"
                ? "Aún no has enviado ninguna solicitud de préstamo."
                : "No hay solicitudes de préstamo pendientes."}
            </p>
            {userRole === "borrower" && (
              <Button onClick={() => setIsNewApplicationModalOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Crear Primera Solicitud
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Application Modal */}
      <Dialog open={isNewApplicationModalOpen} onOpenChange={setIsNewApplicationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requested_amount">Monto Solicitado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="requested_amount"
                    type="number"
                    placeholder="50000"
                    className="pl-8"
                    value={applicationForm.requested_amount}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        requested_amount: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employment_status">Estado Laboral</Label>
                <Select
                  value={applicationForm.employment_status}
                  onValueChange={(value) =>
                    setApplicationForm({
                      ...applicationForm,
                      employment_status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empleado">Empleado</SelectItem>
                    <SelectItem value="independiente">Trabajador Independiente</SelectItem>
                    <SelectItem value="comerciante">Comerciante</SelectItem>
                    <SelectItem value="jubilado">Jubilado</SelectItem>
                    <SelectItem value="desempleado">Desempleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_income">Ingresos Mensuales</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="monthly_income"
                    type="number"
                    placeholder="150000"
                    className="pl-8"
                    value={applicationForm.monthly_income}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        monthly_income: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="existing_debts">Deudas Existentes (opcional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="existing_debts"
                    type="number"
                    placeholder="0"
                    className="pl-8"
                    value={applicationForm.existing_debts}
                    onChange={(e) =>
                      setApplicationForm({
                        ...applicationForm,
                        existing_debts: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Propósito del Préstamo</Label>
              <Textarea
                id="purpose"
                placeholder="Describa para qué utilizará el préstamo..."
                rows={3}
                value={applicationForm.purpose}
                onChange={(e) =>
                  setApplicationForm({
                    ...applicationForm,
                    purpose: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="collateral_description">Descripción de Garantías (opcional)</Label>
              <Textarea
                id="collateral_description"
                placeholder="Describa las garantías que puede ofrecer..."
                rows={3}
                value={applicationForm.collateral_description}
                onChange={(e) =>
                  setApplicationForm({
                    ...applicationForm,
                    collateral_description: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewApplicationModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitApplication}>Enviar Solicitud</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Application Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">
                      {selectedApplication.clients.first_name} {selectedApplication.clients.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">DNI</Label>
                    <p className="font-medium">{selectedApplication.clients.dni}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedApplication.clients.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedApplication.clients.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles del Préstamo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Monto Solicitado</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedApplication.requested_amount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                      <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estado Laboral</Label>
                      <p className="font-medium">{selectedApplication.employment_status}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</Label>
                      <p className="font-medium">{formatCurrency(selectedApplication.monthly_income)}</p>
                    </div>
                  </div>

                  {selectedApplication.existing_debts > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Deudas Existentes</Label>
                      <p className="font-medium">{formatCurrency(selectedApplication.existing_debts)}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Propósito</Label>
                    <p className="font-medium">{selectedApplication.purpose}</p>
                  </div>

                  {selectedApplication.collateral_description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Garantías</Label>
                      <p className="font-medium">{selectedApplication.collateral_description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Fecha de Solicitud</Label>
                      <p className="font-medium">{formatDate(selectedApplication.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Última Actualización</Label>
                      <p className="font-medium">{formatDate(selectedApplication.updated_at)}</p>
                    </div>
                  </div>

                  {selectedApplication.review_notes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Notas de Revisión</Label>
                      <p className="font-medium bg-muted p-3 rounded-md">{selectedApplication.review_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Application Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Revisar Solicitud</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="review_status">Decisión</Label>
              <Select value={reviewStatus} onValueChange={(value: "approved" | "rejected") => setReviewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprobar</SelectItem>
                  <SelectItem value="rejected">Rechazar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="review_notes">Notas de Revisión</Label>
              <Textarea
                id="review_notes"
                placeholder="Agregue comentarios sobre la decisión..."
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReviewApplication}
                variant={reviewStatus === "approved" ? "default" : "destructive"}
              >
                {reviewStatus === "approved" ? "Aprobar" : "Rechazar"} Solicitud
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
