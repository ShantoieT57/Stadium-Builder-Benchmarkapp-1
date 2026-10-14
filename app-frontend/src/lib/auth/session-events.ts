/**
 * Session events raised by the API client so the signed-in frame can react to
 * every request, not just the ones it makes itself (BR3):
 * - `activity`: a request reached the app and succeeded — restarts the idle hour.
 *   Raised for this tab's own requests AND for requests made in another tab of
 *   the same browser (the server session is shared, so is the idle hour).
 * - `unauthorized`: the API answered 401 — the session is gone (idle timeout or
 *   a newer sign-in elsewhere).
 * - `signed-out`: the person chose Sign out in another tab of this browser.
 *
 * Cross-tab sharing uses localStorage (a last-activity timestamp and a sign-out
 * marker) plus the `storage` event, which the browser fires in every OTHER tab.
 * Storage access is guarded: when it is unavailable (private modes, tests) the
 * tab falls back to its own in-memory activity time.
 */
export type SessionEvent = 'activity' | 'unauthorized' | 'signed-out';

type SessionEventListener = (event: SessionEvent) => void;

/** Idle timeout (BR3): 60 minutes without a request reaching the app. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

/** Query parameter value telling the sign-in screen why the person is there. */
export const SIGNED_OUT_REASON = 'signed-out';

/** Sign-in address used when a session ends without the person choosing to. */
export const SIGNED_OUT_SIGN_IN_ROUTE = `/sign-in?reason=${SIGNED_OUT_REASON}`;

/** localStorage key holding the time (ms) of the last successful API response in any tab. */
export const LAST_ACTIVITY_STORAGE_KEY = 'session:last-activity';

/** localStorage key written when the person signs out in any tab. */
export const SIGN_OUT_STORAGE_KEY = 'session:signed-out';

const listeners = new Set<SessionEventListener>();

/** Last activity seen by THIS tab (fallback when storage is unavailable). */
let localLastActivityAt = 0;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota, no window): this tab still
    // tracks its own activity in memory.
  }
}

function emit(event: SessionEvent): void {
  listeners.forEach((listener) => listener(event));
}

function onStorage(event: StorageEvent): void {
  if (event.key === LAST_ACTIVITY_STORAGE_KEY && event.newValue !== null) {
    emit('activity');
  } else if (event.key === SIGN_OUT_STORAGE_KEY && event.newValue !== null) {
    emit('signed-out');
  }
}

/** Subscribe to session events. Returns the unsubscribe function. */
export function onSessionEvent(listener: SessionEventListener): () => void {
  if (listeners.size === 0 && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

/**
 * Time (ms since epoch) of the most recent successful API response in any tab
 * of this browser; 0 when none is known.
 */
export function getLastActivityAt(): number {
  const stored = Number(readStorage(LAST_ACTIVITY_STORAGE_KEY));
  return Math.max(localLastActivityAt, Number.isFinite(stored) ? stored : 0);
}

/** Called by the API client with each response status it receives. */
export function reportApiResponse(status: number): void {
  if (status === 401) {
    emit('unauthorized');
    return;
  }
  if (status >= 200 && status < 300) {
    localLastActivityAt = Date.now();
    writeStorage(LAST_ACTIVITY_STORAGE_KEY, String(localLastActivityAt));
    emit('activity');
  }
}

/**
 * Tell the other tabs of this browser that the person signed out, so they
 * leave the signed-in frame too (BR3: sign-out ends the sign-in everywhere).
 */
export function reportSignedOut(): void {
  writeStorage(SIGN_OUT_STORAGE_KEY, String(Date.now()));
}
