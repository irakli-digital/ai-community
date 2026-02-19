import { MagicRegistrationForm } from './registration-form';

interface Props {
  searchParams: Promise<{ error?: string; email?: string; redirectUrl?: string }>;
}

export default async function MagicLinkPage({ searchParams }: Props) {
  const { error, email, redirectUrl } = await searchParams;

  // Error states from the verify route handler
  if (error === 'expired') {
    return <ErrorState message="This link has expired. Please try again." />;
  }
  if (error === 'used') {
    return <ErrorState message="This link has already been used." />;
  }
  if (error === 'invalid' || (!email && !error)) {
    return <ErrorState message="Invalid magic link." />;
  }

  // New user: show registration form
  if (email && redirectUrl) {
    return (
      <MagicRegistrationForm
        email={email}
        redirectUrl={redirectUrl}
      />
    );
  }

  return <ErrorState message="Invalid magic link." />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">{message}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Go back to the article and try again.
        </p>
      </div>
    </div>
  );
}
