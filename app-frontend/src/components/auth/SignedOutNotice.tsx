'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconButton } from '@/components/ui/icon-button';
import { SIGNED_OUT_REASON } from '@/lib/auth/session-events';

/**
 * Lasting explanation on the sign-in screen when the person's session ended
 * without them choosing to (60 minutes idle, or a newer sign-in elsewhere).
 * Driven by `?reason=signed-out`, so it survives the redirect; it stays until
 * dismissed or the person signs in.
 */
export function SignedOutNotice() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get('reason') !== SIGNED_OUT_REASON) {
    return null;
  }

  return (
    <Alert role="status" className="bg-muted pr-10">
      <Info aria-hidden />
      <AlertDescription className="text-foreground">
        <p>
          You&apos;ve been signed out. This happens after 60 minutes without
          activity or when you sign in somewhere else. Please sign in again.
        </p>
      </AlertDescription>
      <IconButton
        label="Dismiss message"
        icon={<X aria-hidden />}
        size="icon-sm"
        className="absolute top-2 right-2"
        onClick={() => setDismissed(true)}
      />
    </Alert>
  );
}
