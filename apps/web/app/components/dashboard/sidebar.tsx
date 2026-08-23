'use client';

import * as React from 'react';
import { ArrowLeftRight, LayoutDashboard, WalletCards } from 'lucide-react';

import { NavUser } from '@/app/components/dashboard/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import NavLogo from './nav-logo';

export type DashboardPage = 'overview' | 'wallets' | 'transactions';

const navigationItems = [
  { page: 'overview', label: 'Overview', icon: LayoutDashboard },
  { page: 'wallets', label: 'Wallets', icon: WalletCards },
  { page: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
] as const satisfies ReadonlyArray<{
  page: DashboardPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activePage: DashboardPage;
  onPageChange: (page: DashboardPage) => void;
}

export function AppSidebar({ activePage, onPageChange, ...props }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function selectPage(page: DashboardPage) {
    onPageChange(page);

    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='h-16 border-b border-sidebar-border'>
        <div className='flex h-full items-center gap-1'>
          <div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
            <NavLogo />
          </div>
          <SidebarTrigger className='size-8 shrink-0 group-data-[collapsible=icon]:mx-auto' />
        </div>
      </SidebarHeader>
      <SidebarContent className='pt-2'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className='gap-1'>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={activePage === item.page}
                    tooltip={item.label}
                    className='h-10 transition-[background-color,color,transform] duration-150 active:scale-[0.96]'
                    aria-current={activePage === item.page ? 'page' : undefined}
                    onClick={() => selectPage(item.page)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border'>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
