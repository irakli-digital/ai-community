'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n/ka';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelBadge } from '@/components/members/level-badge';
import { OnlineIndicator } from '@/components/members/online-indicator';
import Link from 'next/link';

type LeaderboardEntry = {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  level: number;
  points: number;
  lastSeenAt: string | null;
};

type Period = '7d' | '30d' | 'all';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const tabs: { key: Period; label: string }[] = [
    { key: '7d', label: t('leaderboard.7days') },
    { key: '30d', label: t('leaderboard.30days') },
    { key: 'all', label: t('leaderboard.allTime') },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-7 w-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">
          {t('leaderboard.title')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              period === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {t('leaderboard.noData')}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <Link
              key={entry.id}
              href={`/members/${entry.id}`}
              className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
            >
              {/* Position */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  index === 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : index === 1
                      ? 'bg-gray-100 text-gray-600'
                      : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-500'
                )}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
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
                <OnlineIndicator
                  lastSeenAt={entry.lastSeenAt}
                  className="absolute -bottom-0.5 -right-0.5"
                />
              </div>

              {/* Name + Level */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {entry.name ?? 'მომხმარებელი'}
                  </span>
                  <LevelBadge level={entry.level} size="sm" />
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <span className="text-lg font-bold text-orange-500">
                  {entry.points}
                </span>
                <p className="text-xs text-gray-500">{t('leaderboard.points')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
