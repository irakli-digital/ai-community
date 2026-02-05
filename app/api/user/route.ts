import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  const user = await getUser();

  if (user) {
    // Update lastSeenAt only if stale (>1 min old) to avoid DB write on every request
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const isStale = !user.lastSeenAt || new Date(user.lastSeenAt) < oneMinuteAgo;

    if (isStale) {
      // Fire and forget — don't await or block the response
      db.update(users)
        .set({ lastSeenAt: new Date() })
        .where(eq(users.id, user.id))
        .then(() => {})
        .catch(() => {});
    }
  }

  return Response.json(user);
}
