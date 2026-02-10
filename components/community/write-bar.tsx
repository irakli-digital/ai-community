'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function WriteBar() {
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Link
      href="/community/new"
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || ''} />
        <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">
        Write something...
      </span>
    </Link>
  );
}
