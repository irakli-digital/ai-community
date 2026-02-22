'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/ka';

interface Props {
  email: string;
  redirectUrl: string;
}

export function MagicRegistrationForm({ email, redirectUrl }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const lastName = form.get('lastName') as string;
    const password = form.get('password') as string;

    try {
      const res = await fetch('/api/auth/magic-link/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, lastName, password, redirectUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setPending(false);
        return;
      }

      // Session is set server-side, redirect to the article
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <img src="/logo.svg" alt="Agentic Tribe" className="h-10 w-10" />
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-1">
          {t('auth.magic.completeRegistration')}
        </h2>

        <div className="mt-3 mb-6 flex items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">{email}</span>
        </div>

        {/* Google OAuth option */}
        <a
          href={`/api/auth/google?returnTo=${encodeURIComponent(redirectUrl)}&email=${encodeURIComponent(email)}`}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </a>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              type="text"
              autoComplete="given-name"
              required
              maxLength={100}
              className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="Name"
            />
          </div>
          <div>
            <input
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={100}
              className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="Last Name"
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="Password (min 8 characters)"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              t('auth.signUp')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
