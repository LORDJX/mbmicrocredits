"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
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
}

interface ClientCardProps {
  client: Client
  onClose: () => void
}

export function ClientCard({ client, onClose }: ClientCardProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Tarjeta de Cliente</DialogTitle>
          <p className="text-sm text-muted-foreground">Vista previa para imprimir</p>
        </DialogHeader>

        <div className="print:hidden flex justify-between items-center mb-4">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Ficha
          </Button>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </div>

        {/* Ficha para imprimir */}
        <div id="client-card" className="bg-white text-black p-8 rounded-lg border border-gray-300 print:border-0 print:p-0">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">MB Microcréditos</h1>
            <h2 className="text-xl font-semibold text-gray-700">FICHA DE CLIENTE</h2>
          </div>

          {/* Información del Cliente */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Datos Personales
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Código Cliente:</label>
                  <p className="text-base text-gray-900 font-mono">{client.client_code || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Apellido y Nombre:</label>
                  <p className="text-base text-gray-900">{client.last_name}, {client.first_name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">DNI:</label>
                  <p className="text-base text-gray-900 font-mono">{client.dni}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Dirección:</label>
                  <p className="text-base text-gray-900">{client.address || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Estado:</label>
                  <p className="text-base text-gray-900 capitalize">{client.status || 'Activo'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Datos de Contacto
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Teléfono:</label>
                  <p className="text-base text-gray-900">{client.phone || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Email:</label>
                  <p className="text-base text-gray-900 break-all">{client.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">CBU/CVU:</label>
                  <p className="text-base text-gray-900 font-mono">{client.cbu_cvu || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Alias:</label>
                  <p className="text-base text-gray-900">{client.alias || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Referido por:</label>
                  <p className="text-base text-gray-900">{client.referred_by || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {client.observations && (
            <div className="mb-8">
              <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Observaciones
              </h3>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{client.observations}</p>
            </div>
          )}

          {/* Fotos del DNI */}
          {(client.dni_photo_url || client.dni_back_url) && (
            <div className="mb-8 page-break-before">
              <h3 className="font-bold text-lg text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Documentación - DNI
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.dni_photo_url && (
                  <div className="border border-gray-300 p-4 rounded">
                    <p className="text-sm font-semibold text-gray-600 mb-2 text-center">
                      DNI - Frente
                    </p>
                    <div className="relative w-full aspect-[1.6/1] bg-gray-100 rounded overflow-hidden">
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
                  <div className="border border-gray-300 p-4 rounded">
                    <p className="text-sm font-semibold text-gray-600 mb-2 text-center">
                      DNI - Dorso
                    </p>
                    <div className="relative w-full aspect-[1.6/1] bg-gray-100 rounded overflow-hidden">
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
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center">
            <p className="text-sm text-gray-600">
              Fecha de emisión: {new Date().toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              MB Microcréditos - Sistema de Gestión
            </p>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            
            #client-card,
            #client-card * {
              visibility: visible;
            }
            
            #client-card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
            }

            .page-break-before {
              page-break-before: always;
            }

            @page {
              size: A4;
              margin: 1cm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
