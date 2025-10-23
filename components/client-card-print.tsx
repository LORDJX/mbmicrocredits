"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface Client {
  id: string
  client_code: string
  first_name: string
  last_name: string
  dni: string
  phone: string | null
  email: string | null
  address: string | null
  status: string
  created_at: string
}

interface ClientCardPrintProps {
  client: Client
}

export function ClientCardPrint({ client }: ClientCardPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ficha de Cliente - ${client.client_code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            .field {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .field-label {
              font-weight: bold;
              width: 200px;
            }
            .field-value {
              flex: 1;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-active {
              background-color: #22c55e;
              color: white;
            }
            .status-inactive {
              background-color: #94a3b8;
              color: white;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FICHA DE CLIENTE</h1>
            <p>Código: ${client.client_code}</p>
            <p>Fecha de impresión: ${new Date().toLocaleDateString("es-AR")}</p>
          </div>

          <div class="section">
            <div class="section-title">Información Personal</div>
            <div class="field">
              <div class="field-label">Nombre Completo:</div>
              <div class="field-value">${client.first_name} ${client.last_name}</div>
            </div>
            <div class="field">
              <div class="field-label">DNI:</div>
              <div class="field-value">${client.dni}</div>
            </div>
            <div class="field">
              <div class="field-label">Estado:</div>
              <div class="field-value">
                <span class="status-badge status-${client.status === "active" ? "active" : "inactive"}">
                  ${client.status === "active" ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información de Contacto</div>
            <div class="field">
              <div class="field-label">Teléfono:</div>
              <div class="field-value">${client.phone || "No registrado"}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">${client.email || "No registrado"}</div>
            </div>
            <div class="field">
              <div class="field-label">Dirección:</div>
              <div class="field-value">${client.address || "No registrada"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información del Sistema</div>
            <div class="field">
              <div class="field-label">Código de Cliente:</div>
              <div class="field-value">${client.client_code}</div>
            </div>
            <div class="field">
              <div class="field-label">Fecha de Registro:</div>
              <div class="field-value">${new Date(client.created_at).toLocaleDateString("es-AR")}</div>
            </div>
          </div>

          <div class="footer">
            <p>Este documento es una ficha informativa del cliente</p>
            <p>Generado automáticamente por el sistema</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="h-4 w-4 mr-2" />
      Imprimir Ficha
    </Button>
  )
}
