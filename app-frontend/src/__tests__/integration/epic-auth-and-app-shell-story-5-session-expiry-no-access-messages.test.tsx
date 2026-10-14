/**
 * Story Metadata:
 * - Route: /upload
 * - Target File: app-frontend/src/components/auth/NoAccess.tsx
 * - Page Action: create_new
 *
 * Epic auth-and-app-shell, Story 5: Session timeout, no-access screen and on-screen messages.
 *
 * Vitest scope (AC-4, AC-5) is the shared message behaviour, settled on the EXISTING
 * toast system — src/contexts/ToastContext.tsx + src/components/toast/ — rendered
 * exactly as the root layout mounts it (ToastProvider + ToastContainer).
 * AC-1/AC-2/AC-3 (session loss, idle timeout, no-access screen) are Playwright.
 *
 * Implementation contract these tests assume:
 * - AC-4: a toast shown WITHOUT an explicit `duration` takes its default from its
 *   variant — `success` auto-dismisses after a few seconds; `error` (a problem)
 *   has no auto-dismiss and stays until the person closes it.
 * - AC-5: the icon-only dismiss button shows a visible label (an element with
 *   role="tooltip", named "Dismiss notification") while it is hovered or focused,
 *   and hides it again on unhover/blur. A native `title` attribute is not enough —
 *   browsers never show it on keyboard focus.
 *
 * No backend calls are involved, so nothing is mocked. Fails until implemented (TDD red).
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/toast/ToastContainer';

/**
 * Test driver: buttons that raise messages through the real useToast() hook, so the
 * real provider + container decide how long each message stays.
 */
function MessageTrigger() {
  const { showToast } = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() =>
          showToast({ variant: 'success', title: 'File uploaded' })
        }
      >
        Raise success
      </button>
      <button
        type="button"
        onClick={() => showToast({ variant: 'error', title: 'Upload failed' })}
      >
        Raise problem
      </button>
    </>
  );
}

function renderWithMessages() {
  return render(
    <ToastProvider>
      <MessageTrigger />
      <ToastContainer />
    </ToastProvider>,
  );
}

describe('Epic auth-and-app-shell, Story 5: on-screen messages', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // AC-4
  it('success messages fade on their own while problem messages stay until dismissed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithMessages();

    await user.click(screen.getByRole('button', { name: 'Raise success' }));
    await user.click(screen.getByRole('button', { name: 'Raise problem' }));

    expect(screen.getByText('File uploaded')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');

    // A few seconds later the success message has gone by itself.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByText('File uploaded')).not.toBeInTheDocument();

    // The problem message is still there well after any auto-dismiss window.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const problem = screen.getByRole('alert');
    expect(problem).toHaveTextContent('Upload failed');

    // It leaves only when the person closes it.
    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(screen.queryByText('Upload failed')).not.toBeInTheDocument();
  });

  // AC-5
  it('the icon-only close button shows its label on hover and on keyboard focus', async () => {
    const user = userEvent.setup();
    renderWithMessages();

    await user.click(screen.getByRole('button', { name: 'Raise problem' }));
    const closeButton = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Pointed at: the label appears, and goes when the pointer leaves.
    await user.hover(closeButton);
    expect(
      await screen.findByRole('tooltip', { name: 'Dismiss notification' }),
    ).toBeVisible();
    await user.unhover(closeButton);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Reached with the keyboard: the label appears on focus.
    act(() => {
      closeButton.blur();
    });
    // Tab order: "Raise success", "Raise problem", then the message's close button.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(closeButton).toHaveFocus();
    expect(
      await screen.findByRole('tooltip', { name: 'Dismiss notification' }),
    ).toBeVisible();
  });
});
