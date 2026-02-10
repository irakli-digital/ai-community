'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Shield, CreditCard } from 'lucide-react';
import { t } from '@/lib/i18n/ka';

const settingsNav = [
  { href: '/settings/profile', icon: User, labelKey: 'settings.profile' as const },
  { href: '/settings/account', icon: Shield, labelKey: 'settings.security' as const },
  { href: '/settings/billing', icon: CreditCard, labelKey: 'settings.billing' as const },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('settings.title')}</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="flex sm:flex-col gap-1 sm:w-48 overflow-x-auto">
          {settingsNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-2 whitespace-nowrap ${
                  pathname === item.href
                    ? 'bg-secondary text-primary'
                    : 'text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
