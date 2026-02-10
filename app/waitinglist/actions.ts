'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { waitingList } from '@/lib/db/schema';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(255),
});

export async function joinWaitingList(data: { email: string }): Promise<
  { success: true } | { error: string }
> {
  const parsed = emailSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email } = parsed.data;

  try {
    await db.insert(waitingList).values({ email: email.toLowerCase().trim() });
    return { success: true };
  } catch (err: any) {
    // PostgreSQL unique violation error code
    if (err?.code === '23505') {
      return { error: 'This email is already on the waiting list.' };
    }
    return { error: 'Something went wrong. Please try again.' };
  }
}
