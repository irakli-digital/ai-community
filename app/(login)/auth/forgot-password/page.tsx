'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/ka';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError(t('auth.rateLimited'));
        setPending(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('error.generic'));
        setPending(false);
        return;
      }

      setSent(true);
    } catch {
      setError(t('error.generic'));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('auth.forgotPassword.sent')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.forgotPassword.sentDescription').replace('{email}', email)}
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <img src="/logo.svg" alt="Agentic Tribe" className="h-10 w-10" />
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-1">
          {t('auth.forgotPassword.title')}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {t('auth.forgotPassword.description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              t('auth.forgotPassword.submit')
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
