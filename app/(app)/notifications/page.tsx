'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import useSWR, { mutate } from 'swr';

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

export default function NotificationsPage() {
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (nextCursor: string | null) => {
    setLoading(true);
    const url = nextCursor
      ? `/api/notifications?limit=20&cursor=${nextCursor}`
      : '/api/notifications?limit=20';
    const res = await fetch(url);
    const data = await res.json();
    setAllNotifications((prev) =>
      nextCursor ? [...prev, ...data.notifications] : data.notifications
    );
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications(null);
  }, [loadNotifications]);

  async function markAsRead(notificationId: number) {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
    setAllNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    mutate('/api/notifications/count');
  }

  async function markAllAsRead() {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    mutate('/api/notifications/count');
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

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {allNotifications.length === 0 && !loading && (
          <p className="px-4 py-12 text-center text-muted-foreground">
            No notifications
          </p>
        )}

        {allNotifications.map((notif) => {
          const content = (
            <div
              className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent ${
                !notif.isRead ? 'bg-primary/5' : ''
              }`}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif.id);
              }}
            >
              {notif.actorAvatar ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={notif.actorAvatar} />
                  <AvatarFallback className="text-sm">
                    {notif.actorName?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-xl">
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </p>
              </div>
              {!notif.isRead && (
                <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
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

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadNotifications(cursor)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
