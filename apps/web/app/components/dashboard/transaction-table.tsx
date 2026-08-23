"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Copy, Trash2, Download } from "lucide-react"

type TransactionStatus = "Completed" | "Pending" | "Failed"

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  status: TransactionStatus
}

const transactions: Transaction[] = [
  { id: "1", date: "Feb 15, 2026", description: "Salary Deposit", category: "Income", amount: 4500.0, status: "Completed" },
  { id: "2", date: "Feb 14, 2026", description: "Whole Foods Market", category: "Groceries", amount: -124.85, status: "Completed" },
  { id: "3", date: "Feb 13, 2026", description: "Netflix Subscription", category: "Entertainment", amount: -15.99, status: "Completed" },
  { id: "4", date: "Feb 12, 2026", description: "Freelance Payment", category: "Income", amount: 1700.0, status: "Pending" },
  { id: "5", date: "Feb 11, 2026", description: "Electric Bill", category: "Utilities", amount: -89.5, status: "Completed" },
  { id: "6", date: "Feb 10, 2026", description: "Amazon Purchase", category: "Shopping", amount: -249.99, status: "Completed" },
  { id: "7", date: "Feb 09, 2026", description: "Gas Station", category: "Transportation", amount: -52.3, status: "Completed" },
  { id: "8", date: "Feb 08, 2026", description: "Restaurant - Dinner", category: "Dining", amount: -78.45, status: "Failed" },
  { id: "9", date: "Feb 07, 2026", description: "Gym Membership", category: "Health", amount: -45.0, status: "Completed" },
  { id: "10", date: "Feb 06, 2026", description: "Client Invoice #1042", category: "Income", amount: 2800.0, status: "Pending" },
]

function StatusBadge({ status }: { status: TransactionStatus }) {
  const config: Record<TransactionStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dotClass: string }> = {
    Completed: { variant: "outline", dotClass: "bg-positive" },
    Pending: { variant: "outline", dotClass: "bg-notice" },
    Failed: { variant: "destructive", dotClass: "bg-destructive-foreground" },
  }

  const { variant, dotClass } = config[status]

  return (
    <Badge
      variant={variant}
      className={cn(
        "gap-1.5 font-medium",
        status === "Completed" && "border-positive/30 text-positive bg-positive-subtle",
        status === "Pending" && "border-notice/30 text-notice bg-notice-subtle",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden="true" />
      {status}
    </Badge>
  )
}

function formatCurrency(amount: number) {
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
  return amount < 0 ? `- ${formatted}` : `+ ${formatted}`
}

export function TransactionTable() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {transactions.length} recent transactions
          </CardDescription>
        </div>
        <CardAction>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description</TableHead>
              <TableHead className="hidden sm:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground">Category</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Amount</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="w-10 pr-6">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="pl-6 text-muted-foreground">{tx.date}</TableCell>
                <TableCell className="font-medium text-card-foreground">{tx.description}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="font-medium">
                    {tx.category}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-medium tabular-nums",
                  tx.amount >= 0 ? "text-positive" : "text-negative"
                )}>
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" className="h-7 w-7" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{"Open actions for " + tx.description}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy />
                        Copy reference
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive">
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
