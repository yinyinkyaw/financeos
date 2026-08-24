'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar, type DashboardPage } from '@/components/dashboard/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const pages: Record<DashboardPage, { label: string }> = {
  overview: { label: 'Overview' },
  accounts: { label: 'Accounts' },
  'category-expenses': { label: 'Category Expense' },
  transactions: { label: 'Transaction History' },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activePage: DashboardPage = pathname.startsWith('/accounts')
    ? 'accounts'
    : pathname.startsWith('/category-expenses')
      ? 'category-expenses'
      : pathname.startsWith('/transactions')
        ? 'transactions'
        : 'overview';
  const currentPage = pages[activePage];

  return (
    <SidebarProvider>
      <AppSidebar activePage={activePage} />
      <SidebarInset className='min-w-0'>
        <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background px-3 md:h-16 md:px-4'>
          <SidebarTrigger className='md:hidden' />
          <Breadcrumb className='hidden md:block'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className='text-balance text-sm font-medium sm:text-base'>
                  {currentPage.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className='flex flex-1 flex-col gap-4 p-4 lg:p-4'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
