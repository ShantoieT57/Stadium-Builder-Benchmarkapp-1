/**
 * Session events raised by the API client so the signed-in frame can react to
 * every request, not just the ones it makes itself (BR3):
 * - `activity`: a request reached the app and succeeded — restarts the idle hour.
 * - `unauthorized`: the API answered 401 — the session is gone (idle timeout or
 *   a newer sign-in elsewhere).
 */
export type SessionEvent = 'activity' | 'unauthorized';

type SessionEventListener = (event: SessionEvent) => void;

/** Idle timeout (BR3): 60 minutes without a request reaching the app. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

/** Query parameter value telling the sign-in screen why the person is there. */
export const SIGNED_OUT_REASON = 'signed-out';

/** Sign-in address used when a session ends without the person choosing to. */
export const SIGNED_OUT_SIGN_IN_ROUTE = `/sign-in?reason=${SIGNED_OUT_REASON}`;

const listeners = new Set<SessionEventListener>();

/** Subscribe to session events. Returns the unsubscribe function. */
export function onSessionEvent(listener: SessionEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the API client with each response status it receives. */
export function reportApiResponse(status: number): void {
  const event: SessionEvent | null =
    status === 401
      ? 'unauthorized'
      : status >= 200 && status < 300
        ? 'activity'
        : null;
  if (!event) return;
  listeners.forEach((listener) => listener(event));
}
