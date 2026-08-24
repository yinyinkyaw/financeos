import { BadgeDollarSign } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export default function NavLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<div />} size='lg' className='data-[slot=sidebar-menu-button]:p-2!'>
          <BadgeDollarSign className='size-5!' />
          <span className='text-base font-semibold'>Finance Ledger</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
