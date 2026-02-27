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
  Megaphone,
} from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { users, posts, comments, postLikes, commentLikes, subscriptions, categories } from '@/lib/db/schema';
import { sql, isNull, eq, gte, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { getPostUrl } from '@/lib/utils/post-url';

async function requireAdmin() {
  const user = await getUser();
  const { hasAdminRole } = await import('@/lib/auth/roles');
  if (!user || !hasAdminRole(user.role)) redirect('/community');
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
    draftPostsResult,
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
    // Total posts (published only)
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(isNull(posts.deletedAt), eq(posts.isDraft, false))),
    // Posts 7d (published only)
    db.select({ count: sql<number>`count(*)::int` }).from(posts)
      .where(and(isNull(posts.deletedAt), eq(posts.isDraft, false), gte(posts.createdAt, sevenDaysAgo))),
    // Posts 30d (published only)
    db.select({ count: sql<number>`count(*)::int` }).from(posts)
      .where(and(isNull(posts.deletedAt), eq(posts.isDraft, false), gte(posts.createdAt, thirtyDaysAgo))),
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
    // Popular posts (top 5 by likes, published only)
    db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      authorName: users.name,
      categoryId: posts.categoryId,
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(isNull(posts.deletedAt), eq(posts.isDraft, false)))
      .orderBy(sql`${posts.likesCount} DESC`)
      .limit(5),
    // Draft posts (up to 10, most recent first)
    db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      authorName: users.name,
      categorySlug: categories.slug,
      createdAt: posts.createdAt,
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(isNull(posts.deletedAt), eq(posts.isDraft, true)))
      .orderBy(sql`${posts.createdAt} DESC`)
      .limit(10),
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
    draftPosts: draftPostsResult,
    signupsPerDay: signupsPerDayResult,
  };
}

const adminLinks = [
  {
    href: '/admin/members',
    icon: Users,
    title: 'Manage Members',
    desc: 'View members, change roles',
  },
  {
    href: '/admin/categories',
    icon: FolderOpen,
    title: 'Categories',
    desc: 'Manage post categories',
  },
  {
    href: '/admin/courses',
    icon: BookOpen,
    title: 'Courses',
    desc: 'Manage courses, sections, and lessons',
  },
  {
    href: '/admin/banners',
    icon: Megaphone,
    title: 'Banners',
    desc: 'Manage sidebar promotional banners',
  },
  {
    href: '/admin/community-settings',
    icon: Settings,
    title: 'Community Settings',
    desc: 'Name, description, logo, cover image',
  },
];

export default async function AdminPage() {
  await requireAdmin();
  const analytics = await getAnalytics();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-foreground" />
        <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-foreground" />}
          label="Total Members"
          value={analytics.totalMembers}
          sub={`${analytics.onlineNow} online`}
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5 text-foreground" />}
          label="New Members"
          value={analytics.newMembers7d}
          sub={`last 7 days • ${analytics.newMembers30d} last 30 days`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-foreground" />}
          label="Active Members"
          value={analytics.activeMembers}
          sub="last 30 days"
        />
        <StatCard
          icon={<Heart className="h-5 w-5 text-foreground" />}
          label="Paid Subscriptions"
          value={analytics.paidSubscribers}
          sub="active"
        />
      </div>

      {/* Engagement metrics */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Engagement</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <EngagementCard
            icon={<MessageSquare className="h-5 w-5 text-foreground" />}
            label="Posts"
            total={analytics.totalPosts}
            recent={analytics.posts7d}
            period="last 7 days"
          />
          <EngagementCard
            icon={<MessageSquare className="h-5 w-5 text-foreground" />}
            label="Comments"
            total={analytics.totalComments}
            recent={analytics.comments7d}
            period="last 7 days"
          />
          <EngagementCard
            icon={<Heart className="h-5 w-5 text-foreground" />}
            label="Likes"
            total={analytics.totalLikes}
            recent={analytics.likes7d}
            period="last 7 days"
          />
        </div>
      </div>

      {/* Signup chart (simple bar chart) */}
      {analytics.signupsPerDay.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Signups (Last 14 Days)
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-end gap-1 h-32">
              {analytics.signupsPerDay.map((day, i) => {
                const maxCount = Math.max(...analytics.signupsPerDay.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {day.count}
                    </span>
                    <div
                      className="w-full max-w-8 rounded-t bg-primary transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
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
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Popular Posts
          </h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {analytics.popularPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.authorName} • ❤️ {post.likesCount} • 💬 {post.commentsCount}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Draft posts */}
      {analytics.draftPosts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Draft Posts ({analytics.draftPosts.length})
          </h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {analytics.draftPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                  D
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={getPostUrl({ slug: post.slug, categorySlug: post.categorySlug })}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/community/post/${post.categorySlug || 'general'}/${post.slug}/edit`}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin links */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <link.icon className="mt-0.5 h-5 w-5 text-foreground" />
              <div>
                <p className="font-medium text-foreground">{link.title}</p>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{total}</p>
      <p className="text-xs text-muted-foreground">
        +{recent} {period}
      </p>
    </div>
  );
}
