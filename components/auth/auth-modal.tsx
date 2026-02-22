'use client';

import { useState, useActionState, useEffect, useMemo } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { signIn, signUp } from '@/app/(login)/actions';
import type { ActionState } from '@/lib/auth/middleware';
import { t } from '@/lib/i18n/ka';
import { isInAppBrowser } from '@/lib/utils/detect-webview';

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

  const inAppBrowser = useMemo(() => isInAppBrowser(), []);

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

      {!inAppBrowser && (
      <>
      <a
        href={`/api/auth/google?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/community')}`}
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
      </>
      )}

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
          </>
        )}

        <div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={50}
            className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
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
            className="w-full rounded-md border border-border bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            placeholder={t('auth.passwordPlaceholder')}
          />
          {mode === 'signin' && (
            <div className="mt-1.5 text-right">
              <a
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t('auth.forgotPassword')}
              </a>
            </div>
          )}
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
