'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getAccessScope,
  isPathAllowedForScope,
  type DetentionsAccessScope,
} from '@/lib/auth';
import LoadingPage from '@/app/components/ui/LoadingPage';

/**
 * Verbergt leerlingen- en personeelslijsten bij beperkte Nablijven-toegang.
 */
export default function AccessScopeGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [scope, setScope] = useState<DetentionsAccessScope>('full');

  useEffect(() => {
    const current = getAccessScope();
    setScope(current);
    if (!isPathAllowedForScope(pathname, current)) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return <LoadingPage label={scope === 'limited' ? 'Toegang controleren…' : 'Laden…'} />;
  }

  return <>{children}</>;
}
