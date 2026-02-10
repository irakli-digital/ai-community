'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n/ka';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MemberCard } from '@/components/members/member-card';
import { cn } from '@/lib/utils';

type MemberEntry = {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  level: number;
  points: number;
  lastSeenAt: string | null;
};

export default function MembersPage() {
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (levelFilter) params.set('level', String(levelFilter));

    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/members?${params}`)
        .then((res) => res.json())
        .then((data) => {
          setMembers(data.members || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, levelFilter]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {t('members.title')}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('members.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setLevelFilter(null)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              levelFilter === null
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('members.allLevels')}
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl === levelFilter ? null : lvl)}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                levelFilter === lvl
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {t('members.noMembers')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              id={member.id}
              name={member.name}
              avatarUrl={member.avatarUrl}
              level={member.level}
              points={member.points}
              lastSeenAt={member.lastSeenAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
