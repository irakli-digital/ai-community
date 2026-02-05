import { t } from '@/lib/i18n/ka';
import Link from 'next/link';
import {
  FolderOpen,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Heart,
  UserPlus,
} from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { users, posts, comments, postLikes, commentLikes, subscriptions } from '@/lib/db/schema';
import { sql, isNull, eq, gte, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== 'admin') redirect('/community');
  return user;
}

async function getAnalytics() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const [
    totalMembersResult,
    activeMembersResult,
    onlineResult,
    newMembers7dResult,
    newMembers30dResult,
    totalPostsResult,
    posts7dResult,
    posts30dResult,
    totalCommentsResult,
    comments7dResult,
    totalLikesResult,
    likes7dResult,
    paidSubscribersResult,
    popularPostsResult,
    signupsPerDayResult,
  ] = await Promise.all([
    // Total members
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(isNull(users.deletedAt)),
    // Active members (posted or commented in last 30 days)
    db.select({
      count: sql<number>`(
        SELECT count(DISTINCT u.id)::int FROM users u
        WHERE u.deleted_at IS NULL AND (
          EXISTS (SELECT 1 FROM posts p WHERE p.author_id = u.id AND p.created_at >= ${thirtyDaysAgo.toISOString()}::timestamp)
          OR EXISTS (SELECT 1 FROM comments c WHERE c.author_id = u.id AND c.created_at >= ${thirtyDaysAgo.toISOString()}::timestamp)
        )
      )`,
    }).from(sql`(SELECT 1) AS dummy`),
    // Online now
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(and(isNull(users.deletedAt), sql`${users.lastSeenAt} > ${fiveMinutesAgo.toISOString()}::timestamp`)),
    // New members 7d
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, sevenDaysAgo))),
    // New members 30d
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, thirtyDaysAgo))),
    // Total posts
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(isNull(posts.deletedAt)),
    // Posts 7d
    db.select({ count: sql<number>`count(*)::int` }).from(posts)
      .where(and(isNull(posts.deletedAt), gte(posts.createdAt, sevenDaysAgo))),
    // Posts 30d
    db.select({ count: sql<number>`count(*)::int` }).from(posts)
      .where(and(isNull(posts.deletedAt), gte(posts.createdAt, thirtyDaysAgo))),
    // Total comments
    db.select({ count: sql<number>`count(*)::int` }).from(comments).where(isNull(comments.deletedAt)),
    // Comments 7d
    db.select({ count: sql<number>`count(*)::int` }).from(comments)
      .where(and(isNull(comments.deletedAt), gte(comments.createdAt, sevenDaysAgo))),
    // Total likes (posts + comments)
    db.select({
      count: sql<number>`(SELECT count(*)::int FROM post_likes) + (SELECT count(*)::int FROM comment_likes)`,
    }).from(sql`(SELECT 1) AS dummy`),
    // Likes 7d
    db.select({
      count: sql<number>`(SELECT count(*)::int FROM post_likes WHERE created_at >= ${sevenDaysAgo.toISOString()}::timestamp) + (SELECT count(*)::int FROM comment_likes WHERE created_at >= ${sevenDaysAgo.toISOString()}::timestamp)`,
    }).from(sql`(SELECT 1) AS dummy`),
    // Paid subscribers
    db.select({ count: sql<number>`count(*)::int` }).from(subscriptions)
      .where(eq(subscriptions.status, 'active')),
    // Popular posts (top 5 by likes)
    db.select({
      id: posts.id,
      title: posts.title,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      authorName: users.name,
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(isNull(posts.deletedAt))
      .orderBy(sql`${posts.likesCount} DESC`)
      .limit(5),
    // Signups per day (last 14 days)
    db.select({
      date: sql<string>`to_char(${users.createdAt}, 'MM/DD')`,
      count: sql<number>`count(*)::int`,
    })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`to_char(${users.createdAt}, 'MM/DD'), date(${users.createdAt})`)
      .orderBy(sql`date(${users.createdAt}) ASC`),
  ]);

  return {
    totalMembers: totalMembersResult[0]?.count ?? 0,
    activeMembers: activeMembersResult[0]?.count ?? 0,
    onlineNow: onlineResult[0]?.count ?? 0,
    newMembers7d: newMembers7dResult[0]?.count ?? 0,
    newMembers30d: newMembers30dResult[0]?.count ?? 0,
    totalPosts: totalPostsResult[0]?.count ?? 0,
    posts7d: posts7dResult[0]?.count ?? 0,
    posts30d: posts30dResult[0]?.count ?? 0,
    totalComments: totalCommentsResult[0]?.count ?? 0,
    comments7d: comments7dResult[0]?.count ?? 0,
    totalLikes: totalLikesResult[0]?.count ?? 0,
    likes7d: likes7dResult[0]?.count ?? 0,
    paidSubscribers: paidSubscribersResult[0]?.count ?? 0,
    popularPosts: popularPostsResult,
    signupsPerDay: signupsPerDayResult,
  };
}

const adminLinks = [
  {
    href: '/admin/members',
    icon: Users,
    title: 'წევრების მართვა',
    desc: 'წევრების ნახვა, როლების შეცვლა',
  },
  {
    href: '/admin/categories',
    icon: FolderOpen,
    title: 'კატეგორიები',
    desc: 'პოსტების კატეგორიების მართვა',
  },
  {
    href: '/admin/courses',
    icon: BookOpen,
    title: 'კურსები',
    desc: 'კურსების, სექციებისა და გაკვეთილების მართვა',
  },
  {
    href: '/admin/community-settings',
    icon: Settings,
    title: 'თემის პარამეტრები',
    desc: 'სახელი, აღწერა, ლოგო, ფონი',
  },
];

export default async function AdminPage() {
  await requireAdmin();
  const analytics = await getAnalytics();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-orange-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="სულ წევრები"
          value={analytics.totalMembers}
          sub={`${analytics.onlineNow} ონლაინ`}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5 text-green-600" />}
          label="ახალი წევრები"
          value={analytics.newMembers7d}
          sub={`7 დღეში • ${analytics.newMembers30d} 30 დღეში`}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          label="აქტიური წევრები"
          value={analytics.activeMembers}
          sub="ბოლო 30 დღეში"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<Heart className="h-5 w-5 text-red-600" />}
          label="ფასიანი გამოწერები"
          value={analytics.paidSubscribers}
          sub="აქტიური"
          bgColor="bg-red-50"
        />
      </div>

      {/* Engagement metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ჩართულობა</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <EngagementCard
            icon={<MessageSquare className="h-5 w-5 text-orange-600" />}
            label="პოსტები"
            total={analytics.totalPosts}
            recent={analytics.posts7d}
            period="7 დღეში"
          />
          <EngagementCard
            icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
            label="კომენტარები"
            total={analytics.totalComments}
            recent={analytics.comments7d}
            period="7 დღეში"
          />
          <EngagementCard
            icon={<Heart className="h-5 w-5 text-red-600" />}
            label="მოწონებები"
            total={analytics.totalLikes}
            recent={analytics.likes7d}
            period="7 დღეში"
          />
        </div>
      </div>

      {/* Signup chart (simple bar chart) */}
      {analytics.signupsPerDay.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            რეგისტრაციები (ბოლო 14 დღე)
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-end gap-1 h-32">
              {analytics.signupsPerDay.map((day, i) => {
                const maxCount = Math.max(...analytics.signupsPerDay.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {day.count}
                    </span>
                    <div
                      className="w-full max-w-8 rounded-t bg-orange-400 transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popular posts */}
      {analytics.popularPosts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            პოპულარული პოსტები
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {analytics.popularPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.authorName} • ❤️ {post.likesCount} • 💬 {post.commentsCount}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Admin links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">მართვა</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50/50"
            >
              <link.icon className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">{link.title}</p>
                <p className="text-sm text-gray-500">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function EngagementCard({
  icon,
  label,
  total,
  recent,
  period,
}: {
  icon: React.ReactNode;
  label: string;
  total: number;
  recent: number;
  period: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{total}</p>
      <p className="text-xs text-gray-500">
        +{recent} {period}
      </p>
    </div>
  );
}
