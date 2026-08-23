'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { FinanceCategories } from '@/app/components/dashboard/finance-categories';
import { DatePicker } from '@/app/components/dashboard/date-picker';
import { NavUser } from '@/app/components/dashboard/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const data = {
  categories: [
    {
      name: 'Accounts',
      items: ['Checking', 'Savings', 'Credit Card'],
    },
    {
      name: 'Budgets',
      items: ['Groceries', 'Entertainment', 'Utilities'],
    },
    {
      name: 'Goals',
      items: ['Emergency Fund', 'Vacation', 'Retirement'],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className='h-16 border-b border-sidebar-border'>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className='mx-0' />
        <FinanceCategories categories={data.categories} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus className='size-4' />
              <span>New Category</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
