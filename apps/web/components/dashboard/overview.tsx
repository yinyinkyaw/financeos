"use client"

import { MetricCards } from "./metric-cards"
import { TransactionTable } from "./transaction-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your financial activity and recent transactions.
          </p>
        </div>
        <Tabs defaultValue="30d">
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <MetricCards />
      <Separator />
      <TransactionTable />
    </div>
  )
}
