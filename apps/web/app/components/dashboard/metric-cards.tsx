import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative"
  icon: React.ReactNode
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="pb-0 gap-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary" aria-hidden="true">
            {icon}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tracking-tight text-card-foreground font-mono tabular-nums">{value}</span>
          <div className="flex items-center gap-1.5">
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-positive" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-negative" aria-hidden="true" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" ? "text-positive" : "text-negative"
              )}
            >
              {change}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Balance"
        value="$24,530.00"
        change="+12.5%"
        changeType="positive"
        icon={<Wallet className="h-4 w-4 text-primary" />}
      />
      <MetricCard
        title="Income"
        value="$6,200.00"
        change="+8.2%"
        changeType="positive"
        icon={<DollarSign className="h-4 w-4 text-positive" />}
      />
      <MetricCard
        title="Expenses"
        value="$3,840.00"
        change="+3.1%"
        changeType="negative"
        icon={<CreditCard className="h-4 w-4 text-negative" />}
      />
    </div>
  )
}
