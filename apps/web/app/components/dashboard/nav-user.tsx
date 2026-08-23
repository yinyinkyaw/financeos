'use client';

import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Settings } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { UserLogout } from '../user-logout';

function getInitials(name: string | null | undefined) {
  if (!name) {
    return 'FL';
  }

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: user } = authClient.useSession();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='transition-[background-color,color,transform] duration-150 active:scale-[0.96] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              />
            }
          >
            <Avatar className='rounded-lg'>
              {user?.user.image && <AvatarImage src={user.user.image} alt='' className='rounded-lg' />}
              <AvatarFallback className='rounded-lg bg-primary text-xs font-semibold text-primary-foreground'>
                {getInitials(user?.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{user?.user.name ?? 'Your account'}</span>
              <span className='truncate text-xs text-sidebar-foreground/70'>{user?.user.email}</span>
            </div>
            <ChevronsUpDown className='ml-auto size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar className='rounded-lg'>
                    {user?.user.image && <AvatarImage src={user.user.image} alt='' className='rounded-lg' />}
                    <AvatarFallback className='rounded-lg bg-primary text-xs font-semibold text-primary-foreground'>
                      {getInitials(user?.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>{user?.user.name ?? 'Your account'}</span>
                    <span className='truncate text-xs text-muted-foreground'>{user?.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <UserLogout />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
