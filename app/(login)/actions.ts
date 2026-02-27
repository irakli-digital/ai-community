'use server';

import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  activityLogs,
  type NewUser,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import {
  comparePasswords,
  hashPassword,
  setSession,
} from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { isRateLimited, getClientIp } from '@/lib/auth/rate-limit';
import { sendEmailAsync } from '@/lib/email/mailgun';
import { welcomeEmail } from '@/lib/email/templates';

async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  // Rate limiting
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  if (isRateLimited(`signin:${ip}`)) {
    console.log('[Auth] Rate limited sign-in attempt from IP:', ip);
    return {
      error: 'Too many attempts. Please try again later.',
      email: data.email,
      password: '',
    };
  }

  const { email, password } = data;

  const userResult = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1);

  if (userResult.length === 0) {
    console.log('[Auth] Sign-in failed: user not found for email:', email);
    return {
      error: 'Invalid email or password.',
      email,
      password: '',
    };
  }

  const foundUser = userResult[0];

  // OAuth-only users have no password
  if (!foundUser.passwordHash) {
    console.log('[Auth] Sign-in failed: OAuth-only account for email:', email);
    return {
      error: 'This account uses Google sign-in. Please use the Google button.',
      email,
      password: '',
    };
  }

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    console.log('[Auth] Sign-in failed: invalid password for email:', email);
    return {
      error: 'Invalid email or password.',
      email,
      password: '',
    };
  }

  console.log('[Auth] Sign-in success for user:', foundUser.id, email);

  await Promise.all([
    setSession({ id: foundUser.id, role: foundUser.role }),
    logActivity(foundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ user: foundUser, priceId });
  }

  redirect('/community');
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  // Rate limiting
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  if (isRateLimited(`signup:${ip}`)) {
    console.log('[Auth] Rate limited sign-up attempt from IP:', ip);
    return {
      error: 'Too many attempts. Please try again later.',
      email: data.email,
      password: '',
    };
  }

  const { name, lastName, email, password } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create account. Please try again.',
      email,
      password: '',
    };
  }

  const passwordHash = await hashPassword(password);

  // Admin bootstrap: first registered user becomes admin
  const userCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const isFirstUser = (userCount[0]?.count ?? 0) === 0;

  const newUser: NewUser = {
    name,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
    role: isFirstUser ? 'admin' : 'member',
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create account. Please try again.',
      email,
      password: '',
    };
  }

  console.log('[Auth] Sign-up success for user:', createdUser.id, email);

  await Promise.all([
    logActivity(createdUser.id, ActivityType.SIGN_UP),
    setSession({ id: createdUser.id, role: createdUser.role }),
  ]);

  // Fire-and-forget welcome email
  const emailTemplate = welcomeEmail({ email: createdUser.email });
  sendEmailAsync({ to: createdUser.email, ...emailTemplate });

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ user: createdUser, priceId });
  }

  redirect('/community');
});

export async function signOut() {
  const user = (await getUser()) as User;
  if (user) {
    await logActivity(user.id, ActivityType.SIGN_OUT);
  }
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!user.passwordHash) {
      return {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        error: 'Cannot change password for Google sign-in accounts.',
      };
    }

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current one.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation do not match.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    if (!user.passwordHash) {
      return {
        password: '',
        error: 'Use the confirmation method for Google sign-in accounts.',
      };
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Failed to delete account.',
      };
    }

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const deleteAccountOAuthSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm.' }),
  }),
});

export const deleteAccountOAuth = validatedActionWithUser(
  deleteAccountOAuthSchema,
  async (_data, _, user) => {
    if (user.passwordHash) {
      return { error: 'Use password to delete your account.' };
    }

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);
