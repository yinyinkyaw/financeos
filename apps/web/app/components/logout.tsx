'use client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function LogOut() {
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
    <Button disabled={isPending} aria-disabled={isPending} onClick={handleLogout} aria-label='logout'>
      {isPending ? <Loader2 className='animate-spin' /> : null}
      Logout
    </Button>
  );
}
