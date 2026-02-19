import { redirect } from 'next/navigation';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { magicLinks, users, activityLogs, ActivityType } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { MagicRegistrationForm } from './registration-form';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function MagicLinkPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorState message="Invalid magic link." />;
  }

  // Look up the magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!magicLink) {
    return <ErrorState message="Invalid magic link." />;
  }

  if (magicLink.usedAt) {
    return <ErrorState message="This link has already been used." />;
  }

  if (new Date() > magicLink.expiresAt) {
    return <ErrorState message="This link has expired. Please try again." />;
  }

  // Mark token as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, magicLink.id));

  // Check if user exists (re-check at verification time)
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, magicLink.email), isNull(users.deletedAt)))
    .limit(1);

  if (existingUser) {
    // Existing user: create session and redirect
    await setSession({ id: existingUser.id, role: existingUser.role });
    await db.insert(activityLogs).values({
      userId: existingUser.id,
      action: ActivityType.SIGN_IN,
    });
    redirect(magicLink.redirectUrl);
  }

  // New user: show registration form
  return (
    <MagicRegistrationForm
      email={magicLink.email}
      redirectUrl={magicLink.redirectUrl}
    />
  );
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
