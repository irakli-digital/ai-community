import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  lastSeenAt: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Green dot if user was seen within the last 5 minutes.
 */
export function OnlineIndicator({
  lastSeenAt,
  className,
  size = 'sm',
}: OnlineIndicatorProps) {
  if (!lastSeenAt) return null;

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const isOnline = new Date(lastSeenAt).getTime() > fiveMinutesAgo;

  if (!isOnline) return null;

  return (
    <span
      className={cn(
        'block rounded-full bg-green-500 ring-2 ring-white',
        size === 'sm' && 'h-2.5 w-2.5',
        size === 'md' && 'h-3 w-3',
        className
      )}
      title="ონლაინ"
    />
  );
}

/**
 * Utility to check if a user is online.
 */
export function isUserOnline(lastSeenAt: string | Date | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(lastSeenAt).getTime() > fiveMinutesAgo;
}
