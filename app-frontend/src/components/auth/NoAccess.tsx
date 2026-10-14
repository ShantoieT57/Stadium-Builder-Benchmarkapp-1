import { ShieldAlert } from 'lucide-react';

/**
 * Shown inside the signed-in frame, at the requested address, when the
 * person's role does not allow the screen (e.g. an Approver opening /upload
 * from a saved link). Not an error page: it explains and says who to ask.
 */
export function NoAccess() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-3 px-4 py-8">
      <ShieldAlert aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">
        You don&apos;t have access to this screen
      </h1>
      <p className="text-muted-foreground">
        If you need to use it, ask your administrator to change your role.
      </p>
    </div>
  );
}
