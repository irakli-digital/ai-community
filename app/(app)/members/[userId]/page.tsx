import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { users, posts, categories } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { t } from '@/lib/i18n/ka';
import { LevelBadge } from '@/components/members/level-badge';
import { OnlineIndicator } from '@/components/members/online-indicator';
import { formatDistanceToNow, format } from 'date-fns';
import { ka } from 'date-fns/locale';
import {
  Globe,
  Facebook,
  Linkedin,
  Twitter,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function MemberProfilePage({ params }: Props) {
  const { userId: userIdStr } = await params;
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) notFound();

  // Fetch user
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) notFound();

  // Fetch recent posts
  const recentPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      catName: categories.name,
      catColor: categories.color,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)))
    .orderBy(desc(posts.createdAt))
    .limit(10);

  const displayName = user.name ?? 'მომხმარებელი';
  const initial = (user.name?.[0] ?? '?').toUpperCase();
  const isOnline =
    user.lastSeenAt &&
    new Date(user.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000;

  const socialLinks = [
    { url: user.websiteUrl, icon: Globe, label: 'Website' },
    { url: user.facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: user.linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
    { url: user.twitterUrl, icon: Twitter, label: 'Twitter/X' },
  ].filter((l) => l.url);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-medium text-gray-600">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <OnlineIndicator
              lastSeenAt={user.lastSeenAt?.toISOString() ?? null}
              size="md"
              className="absolute bottom-0 right-0"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {displayName}
              </h1>
              <LevelBadge level={user.level} size="md" />
              {isOnline && (
                <span className="text-xs text-green-600 font-medium">
                  {t('members.online')}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {t('members.joined')}{' '}
                {format(new Date(user.createdAt), 'd MMM yyyy', { locale: ka })}
              </span>
            </div>

            {/* Stats */}
            <div className="mt-4 flex gap-6">
              <div>
                <span className="text-xl font-bold text-orange-500">
                  {user.points}
                </span>
                <p className="text-xs text-gray-500">{t('profile.points')}</p>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {user.level}
                </span>
                <p className="text-xs text-gray-500">{t('profile.level')}</p>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                    title={link.label}
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('members.recentPosts')}
        </h2>
        {recentPosts.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('members.noPosts')}</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900">{post.title}</h3>
                  {post.catName && (
                    <span
                      className="shrink-0 ml-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: post.catColor ?? '#6B7280' }}
                    >
                      {post.catName}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {post.content}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> {post.commentsCount}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ka,
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
