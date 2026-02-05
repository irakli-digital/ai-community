import { db } from '@/lib/db/drizzle';
import { users, subscriptions } from '@/lib/db/schema';
import { isNull, desc, eq, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { AdminMembersClient } from './members-client';

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== 'admin') redirect('/community');
  return user;
}

async function getMembers() {
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      points: users.points,
      level: users.level,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      subscriptionStatus: subscriptions.status,
    })
    .from(users)
    .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  return members;
}

export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await getMembers();

  return <AdminMembersClient members={members} />;
}
