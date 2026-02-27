'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Globe } from 'lucide-react';
import { LevelBadge } from '@/components/members/level-badge';
import { SidebarBanners } from '@/components/community/sidebar-banners';
import { t } from '@/lib/i18n/ka';

interface CommunityInfo {
  name: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  onlineCount: number;
}

interface LeaderboardEntry {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  level: number;
  points: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CommunitySidebar({
  name,
  description,
  logoUrl,
  memberCount,
  onlineCount,
}: CommunityInfo) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetcher('/api/leaderboard?period=30d').then((data) => {
      if (data.entries) {
        setLeaders(data.entries.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  return (
    <aside className="space-y-4">
      {/* Community info */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div>
          <h2 className="font-semibold text-foreground">{name}</h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium text-foreground">{memberCount}</span>
            {t('members.title')}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-medium text-foreground">{onlineCount}</span>
            {t('members.online')}
          </div>
        </div>
      </div>

      {/* Mini leaderboard */}
      {leaders.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('leaderboard.title')}
            </h3>
            <Link
              href="/leaderboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {leaders.map((entry, idx) => (
              <Link
                key={entry.id}
                href={`/members/${entry.id}`}
                className="flex items-center gap-3 group"
              >
                <span className="w-5 text-xs font-medium text-muted-foreground text-right">
                  {idx + 1}
                </span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name ?? ''}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (entry.name?.[0] ?? '?').toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate group-hover:underline">
                      {entry.name ?? 'User'}
                    </span>
                    <LevelBadge level={entry.level} size="sm" />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {entry.points} pts
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Promotional banners */}
      <SidebarBanners />
    </aside>
  );
}
