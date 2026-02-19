import Link from 'next/link';
import { ResetPasswordForm } from './reset-form';
import { t } from '@/lib/i18n/ka';

interface Props {
  searchParams: Promise<{ error?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error, email } = await searchParams;

  if (error === 'expired') {
    return <ErrorState message={t('auth.resetPassword.expired')} />;
  }
  if (error === 'used') {
    return <ErrorState message={t('auth.resetPassword.used')} />;
  }
  if (error === 'invalid') {
    return <ErrorState message={t('auth.magic.invalid')} />;
  }

  if (email) {
    return <ResetPasswordForm email={email} />;
  }

  return <ErrorState message={t('auth.magic.invalid')} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">{message}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            {t('auth.forgotPassword.submit')}
          </Link>
        </p>
      </div>
    </div>
  );
}
