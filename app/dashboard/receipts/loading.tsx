import { AppHeader } from "@/components/app-header"

export default function ReceiptsLoading() {
  return (
    <div className="space-y-6">
      <AppHeader title="Recibos de Pago" />
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando recibos...</p>
        </div>
      </div>
    </div>
  )
}
