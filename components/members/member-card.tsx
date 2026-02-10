import Link from 'next/link';
import { LevelBadge } from './level-badge';
import { OnlineIndicator } from './online-indicator';

interface MemberCardProps {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  level: number;
  points: number;
  lastSeenAt: string | null;
}

export function MemberCard({
  id,
  name,
  avatarUrl,
  level,
  points,
  lastSeenAt,
}: MemberCardProps) {
  const displayName = name ?? 'Member';
  const initial = (name?.[0] ?? '?').toUpperCase();

  return (
    <Link
      href={`/members/${id}`}
      className="flex flex-col items-center rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      {/* Avatar with online indicator */}
      <div className="relative mb-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-medium text-muted-foreground">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <OnlineIndicator
          lastSeenAt={lastSeenAt}
          size="md"
          className="absolute -bottom-0.5 -right-0.5"
        />
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-foreground text-center truncate max-w-full">
        {displayName}
      </p>

      {/* Level badge */}
      <div className="mt-2">
        <LevelBadge level={level} size="sm" />
      </div>

      {/* Points */}
      <p className="mt-1 text-xs text-muted-foreground">{points} points</p>
    </Link>
  );
}
