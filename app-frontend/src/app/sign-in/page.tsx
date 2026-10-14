'use client';

import { Suspense, useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SignedOutNotice } from '@/components/auth/SignedOutNotice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/api/endpoints';
import { homeRouteFor } from '@/lib/auth/roles';
import { emailSchema } from '@/lib/validation/schemas';
import type { APIError } from '@/types/api';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const WRONG_DETAILS_MESSAGE = 'Invalid email or password';
const CONNECTION_PROBLEM_MESSAGE =
  "We can't reach the app right now. Check your connection and try again.";
const UNEXPECTED_PROBLEM_MESSAGE =
  'Something went wrong while signing in. Please try again.';

function validateField(field: Field, value: string): string | undefined {
  if (value.trim().length === 0) {
    return field === 'email' ? 'Email is required' : 'Password is required';
  }
  if (field === 'email') {
    const result = emailSchema.safeParse(value);
    if (!result.success) return result.error.issues[0]?.message;
  }
  // Password: presence only. Sign-in must not enforce password-creation rules.
  return undefined;
}

function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error
  );
}

/** Map a sign-in failure to user-facing copy (BR2: never say which detail was wrong). */
function messageForSignInError(error: unknown): string {
  if (error instanceof TypeError) return CONNECTION_PROBLEM_MESSAGE;
  if (isAPIError(error)) {
    if (error.statusCode === 0) return CONNECTION_PROBLEM_MESSAGE;
    if (error.statusCode === 400 || error.statusCode === 401) {
      return WRONG_DETAILS_MESSAGE;
    }
  }
  return UNEXPECTED_PROBLEM_MESSAGE;
}

export default function SignInPage() {
  const router = useRouter();
  const ids = {
    email: useId(),
    password: useId(),
    emailError: useId(),
    passwordError: useId(),
  };

  const [values, setValues] = useState<Record<Field, string>>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Never show a new message while typing; drop a stale one once the person edits.
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: Field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, values[field]),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {
      email: validateField('email', values.email),
      password: validateField('password', values.password),
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const user = await login({
        email: values.email.trim(),
        password: values.password,
      });
      router.replace(homeRouteFor(user.role));
    } catch (error) {
      setFormError(messageForSignInError(error));
      setSubmitting(false);
    }
  };

  const describedBy = (field: Field) =>
    errors[field]
      ? ids[field === 'email' ? 'emailError' : 'passwordError']
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Sign in</h1>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {/* Reads the URL's query, so it renders on the client only. */}
            <Suspense fallback={null}>
              <SignedOutNotice />
            </Suspense>

            {formError && (
              <div
                role="alert"
                className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.email}>
                Email
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id={ids.email}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy('email')}
              />
              {errors.email && (
                <p id={ids.emailError} className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.password}>
                Password
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id={ids.password}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy('password')}
              />
              {errors.password && (
                <p id={ids.passwordError} className="text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-sm text-muted-foreground">
              Forgot your password? Please contact your administrator.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
