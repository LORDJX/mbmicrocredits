"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, X, Calendar, Phone, DollarSign, Check, ChevronDown, FilterX } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface Installment {
  id: string
  loan_code: string
  client_name: string
  client_code: string
  phone?: string
  installment_no: number
  installments_total: number
  due_date: string
  amount_due: number
  amount_paid: number
  balance_due: number
  original_status: string
}

interface CronogramaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todayInstallments: Installment[]
  overdueInstallments: Installment[]
  upcomingInstallments: Installment[]
}

interface Client {
  id: string
  first_name: string
  last_name: string
  client_code: string
  dni: string
}

export function CronogramaModal({
  open,
  onOpenChange,
  todayInstallments,
  overdueInstallments,
  upcomingInstallments,
}: CronogramaModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientCode, setSelectedClientCode] = useState<string>("")
  const [openClientPopover, setOpenClientPopover] = useState(false)

  // Cargar clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        const data = await response.json()
        setClients(data.clients || [])
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }
    if (open) {
      fetchClients()
    }
  }, [open])

  // Filtrar cuotas por cliente seleccionado
  const filteredOverdue = useMemo(() => {
    if (!selectedClientCode) return overdueInstallments
    return overdueInstallments.filter((inst) => inst.client_code === selectedClientCode)
  }, [overdueInstallments, selectedClientCode])

  const filteredToday = useMemo(() => {
    if (!selectedClientCode) return todayInstallments
    return todayInstallments.filter((inst) => inst.client_code === selectedClientCode)
  }, [todayInstallments, selectedClientCode])

  const filteredUpcoming = useMemo(() => {
    if (!selectedClientCode) return upcomingInstallments
    return upcomingInstallments.filter((inst) => inst.client_code === selectedClientCode)
  }, [upcomingInstallments, selectedClientCode])

  // Calcular totales filtrados
  const totalOverdue = filteredOverdue.reduce((sum, inst) => sum + inst.balance_due, 0)
  const totalToday = filteredToday.reduce((sum, inst) => sum + inst.balance_due, 0)
  const totalUpcoming = filteredUpcoming.reduce((sum, inst) => sum + inst.balance_due, 0)

  // Cliente seleccionado
  const selectedClient = clients.find((c) => c.client_code === selectedClientCode)

  const clearFilter = () => {
    setSelectedClientCode("")
  }

  const generatePDFBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Configuración de colores
    const primaryColor = [37, 99, 235] // blue-600
    const dangerColor = [220, 38, 38] // red-600
    const warningColor = [234, 88, 12] // orange-600
    const successColor = [22, 163, 74] // green-600

    // Header con logo y fecha
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 297, 25, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("CRONOGRAMA DE PAGOS", 148.5, 12, { align: "center" })

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const today = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    let subtitle = `Fecha de impresión: ${today}`
    if (selectedClient) {
      subtitle += ` | Cliente: ${selectedClient.first_name} ${selectedClient.last_name} (${selectedClient.client_code})`
    }
    doc.text(subtitle, 148.5, 19, { align: "center" })

    let yPosition = 35

    // Función para agregar sección
    const addSection = (title: string, installments: Installment[], total: number, color: number[], startY: number) => {
      // Header de sección
      doc.setFillColor(color[0], color[1], color[2])
      doc.rect(10, startY, 277, 10, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(
        `${title} (${installments.length} cuotas - Total: $${total.toLocaleString("es-ES", { minimumFractionDigits: 2 })})`,
        148.5,
        startY + 7,
        { align: "center" },
      )

      // Tabla de cuotas
      if (installments.length > 0) {
        autoTable(doc, {
          startY: startY + 12,
          head: [["Cuota", "Cliente", "Préstamo", "Vencimiento", "Monto", "Teléfono"]],
          body: installments.map((inst) => [
            `${inst.installment_no}/${inst.installments_total}`,
            `${inst.client_name}\n(${inst.client_code})`,
            inst.loan_code,
            new Date(inst.due_date).toLocaleDateString("es-ES"),
            `$${inst.balance_due.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
            inst.phone || "N/A",
          ]),
          headStyles: {
            fillColor: color,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 10, right: 10 },
          theme: "grid",
        })

        return (doc as any).lastAutoTable.finalY + 10
      } else {
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(10)
        doc.setFont("helvetica", "italic")
        doc.text("No hay cuotas en esta categoría", 148.5, startY + 20, { align: "center" })
        return startY + 30
      }
    }

    // Agregar secciones con datos filtrados
    yPosition = addSection("CUOTAS VENCIDAS", filteredOverdue, totalOverdue, dangerColor, yPosition)

    // Nueva página si es necesario
    if (yPosition > 180) {
      doc.addPage()
      yPosition = 20
    }

    yPosition = addSection("CUOTAS QUE VENCEN HOY", filteredToday, totalToday, warningColor, yPosition)

    // Nueva página si es necesario
    if (yPosition > 180) {
      doc.addPage()
      yPosition = 20
    }

    yPosition = addSection("CUOTAS A VENCER", filteredUpcoming, totalUpcoming, successColor, yPosition)

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Página ${i} de ${pageCount}`, 148.5, 200, { align: "center" })
    }

    // Retornar como Blob
    return doc.output("blob")
  }

  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const pdfBlob = await generatePDFBlob()
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      const fileName = selectedClient
        ? `cronograma-${selectedClient.client_code}-${new Date().toISOString().split("T")[0]}.pdf`
        : `cronograma-${new Date().toISOString().split("T")[0]}.pdf`
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF. Por favor, intenta nuevamente.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const InstallmentCard = ({ installment }: { installment: Installment }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-lg">{installment.client_name}</p>
            <p className="text-sm text-muted-foreground font-mono">{installment.client_code}</p>
          </div>
          <Badge variant="outline" className="font-mono">
            {installment.installment_no}/{installment.installments_total}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg">
              ${installment.balance_due.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Préstamo: {installment.loan_code}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Vence: {new Date(installment.due_date).toLocaleDateString("es-ES")}</span>
          </div>

          {installment.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{installment.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffffff;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e0e0e0;
        }
      `}</style>

      <DialogContent className="!max-w-none w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-3">Cronograma de Pagos</DialogTitle>
              
              {/* Filtro de Cliente */}
              <div className="flex items-center gap-2">
                <Popover open={openClientPopover} onOpenChange={setOpenClientPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-[350px] justify-between", !selectedClientCode && "text-muted-foreground")}
                    >
                      {selectedClient
                        ? `${selectedClient.first_name} ${selectedClient.last_name} (${selectedClient.client_code})`
                        : "Filtrar por cliente..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command shouldFilter={true}>
                      <CommandInput placeholder="Buscar por nombre o DNI..." className="h-9" />
                      <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                      <CommandList className="max-h-64 overflow-y-auto">
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={`${client.first_name} ${client.last_name} ${client.client_code} ${client.dni}`}
                              onSelect={() => {
                                setSelectedClientCode(client.client_code)
                                setOpenClientPopover(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClientCode === client.client_code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">
                                  {client.first_name} {client.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {client.client_code} - DNI: {client.dni}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedClientCode && (
                  <Button variant="ghost" size="sm" onClick={clearFilter}>
                    <FilterX className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={generatePDF} disabled={isGeneratingPDF} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generando..." : "Imprimir PDF"}
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cuotas Vencidas */}
            <div className="space-y-4">
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-700 flex items-center justify-between">
                    <span>Cuotas Vencidas</span>
                    <Badge variant="destructive">{filteredOverdue.length}</Badge>
                  </CardTitle>
                  <p className="text-2xl font-bold text-red-900">
                    ${totalOverdue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </p>
                </CardHeader>
              </Card>

              <div className="space-y-3 max-h-[calc(90vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {filteredOverdue.length > 0 ? (
                  filteredOverdue.map((inst) => <InstallmentCard key={inst.id} installment={inst} />)
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      {selectedClientCode ? "Este cliente no tiene cuotas vencidas" : "No hay cuotas vencidas"}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cuotas que Vencen Hoy */}
            <div className="space-y-4">
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-700 flex items-center justify-between">
                    <span>Vencen Hoy</span>
                    <Badge className="bg-orange-500">{filteredToday.length}</Badge>
                  </CardTitle>
                  <p className="text-2xl font-bold text-orange-900">
                    ${totalToday.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </p>
                </CardHeader>
              </Card>

              <div className="space-y-3 max-h-[calc(90vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {filteredToday.length > 0 ? (
                  filteredToday.map((inst) => <InstallmentCard key={inst.id} installment={inst} />)
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      {selectedClientCode ? "Este cliente no tiene cuotas que vencen hoy" : "No hay cuotas que vencen hoy"}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cuotas a Vencer */}
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 flex items-center justify-between">
                    <span>Cuotas a Vencer</span>
                    <Badge className="bg-green-600">{filteredUpcoming.length}</Badge>
                  </CardTitle>
                  <p className="text-2xl font-bold text-green-900">
                    ${totalUpcoming.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </p>
                </CardHeader>
              </Card>

              <div className="space-y-3 max-h-[calc(90vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUpcoming.length > 0 ? (
                  filteredUpcoming.map((inst) => <InstallmentCard key={inst.id} installment={inst} />)
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      {selectedClientCode ? "Este cliente no tiene cuotas próximas a vencer" : "No hay cuotas próximas a vencer"}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
