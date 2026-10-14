/**
 * Story Metadata:
 * - Route: /sign-in
 * - Target File: app-frontend/src/app/sign-in/page.tsx
 * - Page Action: create_new
 *
 * Tests for Epic auth-and-app-shell, Story 3: Sign-in screen (AC-1..AC-4).
 * AC-5 (role-based landing) is covered by the Playwright spec.
 *
 * Mocking: only `@/lib/api/client` is mocked. The page signs in through
 * `login()` in `@/lib/api/endpoints`, which calls `apiClient`. Rejections mirror
 * what the real client throws: a 401 APIError for wrong details, and a
 * statusCode-0 "Network error" APIError when the API cannot be reached. The page
 * owns the user-facing copy (BR2: always "Invalid email or password").
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
// Will fail until implemented (TDD red)
import SignInPage from '@/app/sign-in/page';
import { apiClient } from '@/lib/api/client';
import type { APIError } from '@/types/api';
import { createErrorResponse, seededUsers } from '@/mocks/data/identity';

vi.mock('@/lib/api/client', () => ({
  apiClient: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/sign-in',
  useSearchParams: () => new URLSearchParams(),
}));

const mockApiClient = apiClient as Mock;

const WRONG_DETAILS_MESSAGE = createErrorResponse().message; // "Invalid email or password"

const unauthorizedError: APIError = {
  message: 'Unauthorized: Please log in to continue',
  statusCode: 401,
  details: ['Your session may have expired. Please log in again.'],
  endpoint: '/api/auth/login',
};

const networkError: APIError = {
  message: 'Network error: Unable to connect to the API server',
  statusCode: 0,
  details: ['Please check your internet connection and try again.'],
  endpoint: '/api/auth/login',
};

const emailField = () => screen.getByLabelText(/email/i);
const passwordField = () => screen.getByLabelText(/password/i);
const signInButton = () => screen.getByRole('button', { name: /sign in/i });

describe('Epic auth-and-app-shell, Story 3: Sign-in screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1
  it('shows required email and password fields and the contact-your-administrator note', () => {
    render(<SignInPage />);

    expect(emailField()).toBeRequired();
    expect(passwordField()).toBeRequired();
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(
      screen.getByText(/forg[eo]t.*password[\s\S]*contact your administrator/i),
    ).toBeInTheDocument();
  });

  // AC-2
  it('shows a required message when an empty field is left and on submit, but not while typing', async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    // While typing (field still focused) no required message appears, even when emptied again
    await user.click(emailField());
    await user.type(emailField(), 'f');
    await user.clear(emailField());
    expect(emailField()).not.toHaveAccessibleDescription(/required/i);

    // Leaving the empty field shows the message
    await user.tab();
    await waitFor(() => {
      expect(emailField()).toHaveAccessibleDescription(/required/i);
    });
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');

    // Password was never visited — submitting shows its required message too, and no sign-in is attempted
    expect(passwordField()).not.toHaveAccessibleDescription(/required/i);
    await user.click(signInButton());
    await waitFor(() => {
      expect(passwordField()).toHaveAccessibleDescription(/required/i);
    });
    expect(emailField()).toHaveAccessibleDescription(/required/i);
    expect(mockApiClient).not.toHaveBeenCalled();
  });

  // AC-3
  it('shows "Invalid email or password" for wrong details and stays on the sign-in screen', async () => {
    mockApiClient.mockRejectedValue(unauthorizedError);
    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(emailField(), seededUsers.Importer.email);
    await user.type(passwordField(), 'WrongPassword1');
    await user.click(signInButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(WRONG_DETAILS_MESSAGE);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(emailField()).toHaveValue(seededUsers.Importer.email);
    expect(signInButton()).toBeInTheDocument();
  });

  // AC-4
  it('shows a connection-problem message, distinct from the wrong-details message, when the app cannot be reached', async () => {
    mockApiClient.mockRejectedValue(networkError);
    const user = userEvent.setup();
    render(<SignInPage />);

    await user.type(emailField(), seededUsers.Approver.email);
    await user.type(passwordField(), seededUsers.Approver.password);
    await user.click(signInButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/connect|reach/i);
    expect(alert).not.toHaveTextContent(WRONG_DETAILS_MESSAGE);
    expect(screen.queryByText(WRONG_DETAILS_MESSAGE)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
