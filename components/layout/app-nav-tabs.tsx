'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  GraduationCap,
  Users,
  Trophy,
  Shield,
} from 'lucide-react';
import { t } from '@/lib/i18n/ka';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const navItems = [
  { href: '/community', icon: MessageSquare, labelKey: 'nav.community' as const },
  { href: '/classroom', icon: GraduationCap, labelKey: 'nav.classroom' as const },
  // { href: '/members', icon: Users, labelKey: 'nav.members' as const },
  { href: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' as const },
];

export function AppNavTabs() {
  const pathname = usePathname();
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const isActive = (href: string) => {
    if (href === '/community') return pathname === '/community' || pathname.startsWith('/community/');
    return pathname.startsWith(href);
  };

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive('/admin')
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Shield className="h-4 w-4" />
              {t('nav.admin')}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
