import { Construction } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface ComingSoonProps {
  pageName: string
}

export function ComingSoon({ pageName }: ComingSoonProps) {
  return (
    <Card className="flex flex-1 border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Construction className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-lg font-semibold text-foreground">{pageName}</h2>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            This section is currently under development. Check back soon for updates.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-notice/30 text-notice bg-notice-subtle font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-notice" aria-hidden="true" />
          Coming Soon
        </Badge>
      </CardContent>
    </Card>
  )
}
