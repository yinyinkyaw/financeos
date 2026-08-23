'use client';
import { Loader2, LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function UserLogout() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.replace('/sign-in');
      router.refresh();
    });
  };
  return (
    <Button
      variant='destructive'
      disabled={isPending}
      aria-disabled={isPending}
      onClick={handleLogout}
      aria-label='logout'
      className='w-full'
    >
      {isPending ? <Loader2 className='animate-spin' /> : <LogOut />}
      Logout
    </Button>
  );
}
