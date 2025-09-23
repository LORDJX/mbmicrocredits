import { PageLayout } from "@/components/page-layout"

export default function RecibosLoading() {
  return (
    <PageLayout title="Recibos de Pago">
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Card Skeleton */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-60 animate-pulse"></div>
              </div>
              <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded w-80 animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
