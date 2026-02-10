'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  actorId: number | null;
  actorName: string | null;
  actorAvatar: string | null;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData, mutate: mutateCount } = useSWR<{ count: number }>(
    '/api/notifications/count',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: notifData, mutate: mutateNotifs } = useSWR<{
    notifications: NotificationItem[];
    nextCursor: string | null;
  }>(isOpen ? '/api/notifications?limit=10' : null, fetcher);

  const unreadCount = countData?.count ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAsRead(notificationId: number) {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
    mutateCount();
    mutateNotifs();
  }

  async function markAllAsRead() {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    mutateCount();
    mutateNotifs();
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'post_like':
      case 'comment_like':
        return '❤️';
      case 'post_comment':
      case 'comment_reply':
        return '💬';
      case 'level_up':
        return '🎉';
      case 'new_course':
        return '📚';
      case 'announcement':
        return '📢';
      default:
        return '🔔';
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {(!notifData?.notifications || notifData.notifications.length === 0) && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </p>
            )}

            {notifData?.notifications.map((notif) => {
              const content = (
                <div
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent ${
                    !notif.isRead ? 'bg-secondary' : ''
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    setIsOpen(false);
                  }}
                >
                  {notif.actorAvatar ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notif.actorAvatar} />
                      <AvatarFallback className="text-xs">
                        {notif.actorName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-lg">
                      {getNotificationIcon(notif.type)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !notif.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: enUS,
                      })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );

              return notif.linkUrl ? (
                <Link key={notif.id} href={notif.linkUrl} className="block">
                  {content}
                </Link>
              ) : (
                <div key={notif.id} className="cursor-pointer">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium text-primary hover:text-primary/80"
            >
              All notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
