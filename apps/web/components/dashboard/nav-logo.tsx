import { BrandMark } from '@/components/brand-mark';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { PRODUCT_NAME } from '@/lib/brand';

export default function NavLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<div />} size='lg' className='data-[slot=sidebar-menu-button]:p-2!'>
          <BrandMark className='size-8 rounded-lg text-sm' />
          <span className='text-base font-semibold tracking-tight'>{PRODUCT_NAME}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
