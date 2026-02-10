'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { t } from '@/lib/i18n/ka';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.svg" alt="Agentic Tribe" className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />

          {mode === 'signup' && (
            <>
              <div>
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="given-name"
                    required
                    maxLength={100}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-secondary focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-foreground"
                >
                  Last Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    maxLength={100}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-secondary focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              {t('auth.email')}
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-secondary focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t('auth.password')}
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-secondary focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-red-400 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t('common.loading')}
                </>
              ) : mode === 'signin' ? (
                t('auth.signIn')
              ) : (
                t('auth.signUp')
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              {mode === 'signin'
                ? t('auth.createAccount')
                : t('auth.signInExisting')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
