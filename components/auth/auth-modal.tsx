'use client';

import { useState, useActionState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/app/(login)/actions';
import type { ActionState } from '@/lib/auth/middleware';
import { t } from '@/lib/i18n/ka';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ open, onClose, defaultMode = 'signup' }: AuthModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-lg border border-border bg-card shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <AuthForm defaultMode={defaultMode} />
      </div>
    </div>
  );
}

function AuthForm({ defaultMode }: { defaultMode: 'signin' | 'signup' }) {
  const [mode, setMode] = useState(defaultMode);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  return (
    <div className="p-8">
      <div className="flex justify-center mb-6">
        <img src="/logo.svg" alt="Agentic Tribe" className="h-10 w-10" />
      </div>

      <h2 className="text-xl font-bold text-foreground text-center mb-1">
        {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {mode === 'signin' ? 'Sign in to Agentic Tribe' : 'Join Agentic Tribe'}
      </p>

      <form className="space-y-4" action={formAction} key={mode}>
        {mode === 'signup' && (
          <>
            <div>
              <input
                name="name"
                type="text"
                autoComplete="given-name"
                required
                maxLength={100}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
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
                className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                placeholder="Last Name"
              />
            </div>
          </>
        )}

        <div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={50}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>

        <div>
          <input
            name="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            maxLength={100}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : mode === 'signin' ? (
            t('auth.signIn')
          ) : (
            t('auth.signUp')
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-primary hover:underline font-medium"
        >
          {mode === 'signin' ? t('auth.createAccount') : t('auth.signInExisting')}
        </button>
      </p>
    </div>
  );
}
