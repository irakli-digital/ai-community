'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/ka';

interface Props {
  email: string;
}

export function ResetPasswordForm({ email }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirmPassword = form.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError(t('error.passwordMismatch'));
      setPending(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('error.generic'));
        setPending(false);
        return;
      }

      router.push('/sign-in?message=password-reset');
    } catch {
      setError(t('error.generic'));
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
          {t('auth.resetPassword.title')}
        </h2>

        <div className="mt-3 mb-6 flex items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">{email}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder={t('auth.newPassword')}
            />
          </div>
          <div>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder={t('auth.confirmPassword')}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              t('auth.resetPassword.submit')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
