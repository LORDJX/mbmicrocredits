"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download } from "lucide-react"

interface PrintButtonProps {
  content: string
  title?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function PrintButton({
  content,
  title = "Documento",
  variant = "outline",
  size = "sm",
  className,
}: PrintButtonProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .content {
                margin-bottom: 30px;
              }
              .footer {
                border-top: 1px solid #ccc;
                padding-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MB Microcréditos</h1>
              <h2>${title}</h2>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handlePrint} className={className}>
      <Printer className="h-4 w-4 mr-2" />
      Imprimir
    </Button>
  )
}

interface PDFDownloadProps {
  content: string
  filename?: string
  title?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function PDFDownload({
  content,
  filename = "documento.html",
  title = "Documento",
  variant = "outline",
  size = "sm",
  className,
}: PDFDownloadProps) {
  const handleDownload = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .content {
              margin-bottom: 30px;
            }
            .footer {
              border-top: 1px solid #ccc;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MB Microcréditos</h1>
            <h2>${title}</h2>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".html") ? filename : `${filename}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} className={className}>
      <Download className="h-4 w-4 mr-2" />
      Descargar
    </Button>
  )
}
