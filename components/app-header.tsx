interface AppHeaderProps {
  title: string
  description?: string
}

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  )
}
