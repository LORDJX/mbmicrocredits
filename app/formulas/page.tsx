import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, DollarSign, Percent, Calendar, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function FormulasPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Calculadora de Fórmulas" description="Herramientas de cálculo para préstamos e intereses" />

      <div className="flex items-center justify-between">
        <div>{/* Header removed as it's replaced by PageHeader */}</div>
      </div>

      <Tabs defaultValue="loan-calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="loan-calculator">Calculadora de Préstamos</TabsTrigger>
          <TabsTrigger value="interest-calculator">Cálculo de Intereses</TabsTrigger>
          <TabsTrigger value="payment-schedule">Cronograma de Pagos</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="loan-calculator" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora de Préstamos
                </CardTitle>
                <CardDescription>Calcula el monto total a pagar y las cuotas mensuales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="loan-amount">Monto del Préstamo</Label>
                  <Input id="loan-amount" type="number" placeholder="10000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="interest-rate">Tasa de Interés (%)</Label>
                  <Input id="interest-rate" type="number" placeholder="15" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="installments">Número de Cuotas</Label>
                  <Input id="installments" type="number" placeholder="12" />
                </div>
                <Button className="w-full">Calcular</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resultados del Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Monto del Préstamo:</span>
                  <span className="font-bold">$10,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Intereses Totales:</span>
                  <span className="font-bold text-orange-600">$1,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total a Pagar:</span>
                  <span className="font-bold text-green-600">$11,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">Cuota Mensual:</span>
                  <span className="font-bold text-primary">$958.33</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interest-calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Calculadora de Intereses
              </CardTitle>
              <CardDescription>Calcula intereses simples y compuestos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="principal">Capital Inicial</Label>
                    <Input id="principal" type="number" placeholder="5000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rate">Tasa de Interés Anual (%)</Label>
                    <Input id="rate" type="number" placeholder="12" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Tiempo (meses)</Label>
                    <Input id="time" type="number" placeholder="6" />
                  </div>
                  <Button className="w-full">Calcular Intereses</Button>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Resultados:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Interés Simple:</span>
                      <span className="font-medium">$300</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Interés Compuesto:</span>
                      <span className="font-medium">$308.55</span>
                    </div>
                    <div className="flex justify-between p-2 bg-primary/10 rounded">
                      <span>Monto Final:</span>
                      <span className="font-bold">$5,308.55</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generador de Cronograma
              </CardTitle>
              <CardDescription>Genera cronogramas de pago personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="grid gap-2">
                  <Label htmlFor="schedule-amount">Monto</Label>
                  <Input id="schedule-amount" type="number" placeholder="15000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule-rate">Tasa (%)</Label>
                  <Input id="schedule-rate" type="number" placeholder="18" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule-periods">Cuotas</Label>
                  <Input id="schedule-periods" type="number" placeholder="10" />
                </div>
              </div>
              <Button className="mb-4">Generar Cronograma</Button>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Cuota</th>
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-left">Capital</th>
                      <th className="p-3 text-left">Interés</th>
                      <th className="p-3 text-left">Total</th>
                      <th className="p-3 text-left">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3">1</td>
                      <td className="p-3">15/01/2024</td>
                      <td className="p-3">$1,275</td>
                      <td className="p-3">$225</td>
                      <td className="p-3 font-medium">$1,500</td>
                      <td className="p-3">$13,725</td>
                    </tr>
                    <tr className="border-t bg-muted/50">
                      <td className="p-3">2</td>
                      <td className="p-3">15/02/2024</td>
                      <td className="p-3">$1,294</td>
                      <td className="p-3">$206</td>
                      <td className="p-3 font-medium">$1,500</td>
                      <td className="p-3">$12,431</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis de Rentabilidad
              </CardTitle>
              <CardDescription>Calcula la rentabilidad de los préstamos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="investment">Inversión Total</Label>
                    <Input id="investment" type="number" placeholder="100000" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="returns">Retornos Mensuales</Label>
                    <Input id="returns" type="number" placeholder="8500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expenses">Gastos Operativos</Label>
                    <Input id="expenses" type="number" placeholder="2000" />
                  </div>
                  <Button className="w-full">Calcular Rentabilidad</Button>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Métricas de Rentabilidad:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">ROI Mensual:</span>
                      <span className="font-bold text-green-600">6.5%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">ROI Anual:</span>
                      <span className="font-bold text-blue-600">78%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Ganancia Neta:</span>
                      <span className="font-bold text-orange-600">$6,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Tiempo de Recuperación:</span>
                      <span className="font-bold text-purple-600">15.4 meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
