'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  GraduationCap,
  Users,
  Trophy,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { t } from '@/lib/i18n/ka';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const navItems = [
  { href: '/community', icon: MessageSquare, labelKey: 'nav.community' as const },
  { href: '/classroom', icon: GraduationCap, labelKey: 'nav.classroom' as const },
  { href: '/members', icon: Users, labelKey: 'nav.members' as const },
  { href: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' as const },
];

const bottomItems = [
  { href: '/settings/profile', icon: Settings, labelKey: 'nav.settings' as const },
];

export function AppSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const isActive = (href: string) => {
    if (href === '/community') return pathname === '/community' || pathname.startsWith('/community/');
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col h-full px-3 pb-4 lg:pt-4">
          <div className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.labelKey)}
                </Button>
              </Link>
            ))}

            {user?.role === 'admin' && (
              <Link href="/admin" onClick={onClose}>
                <Button
                  variant={isActive('/admin') ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    isActive('/admin')
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  {t('nav.admin')}
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-1 border-t border-border pt-4">
            {bottomItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <Button
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.labelKey)}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
