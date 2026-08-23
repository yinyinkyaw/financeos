"use client"

import { useState } from "react"
import { AppSidebar } from "@/app/components/dashboard/sidebar"
import { Overview } from "./overview"
import { ComingSoon } from "./coming-soon"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const pages: Record<string, { label: string }> = {
  overview: { label: "Overview" },
  transactions: { label: "Transactions" },
  budget: { label: "Budget" },
  investments: { label: "Investments" },
  reports: { label: "Reports" },
  settings: { label: "Settings" },
}

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState("overview")

  const currentPage = pages[activeTab] ?? pages.overview!

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("overview")
                  }}
                >
                  FinanceOS
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {activeTab === "overview" ? (
            <Overview />
          ) : (
            <ComingSoon pageName={currentPage.label} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
