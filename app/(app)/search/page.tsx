'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/members/level-badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

type SearchTab = 'posts' | 'courses' | 'members';

const tabs: { key: SearchTab; label: string }[] = [
  { key: 'posts', label: 'პოსტები' },
  { key: 'courses', label: 'კურსები' },
  { key: 'members', label: 'წევრები' },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">იტვირთება...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') as SearchTab) || 'posts';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const search = useCallback(
    async (q: string, tab: SearchTab, newOffset: number) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&tab=${tab}&limit=${LIMIT}&offset=${newOffset}`
        );
        const data = await res.json();
        if (newOffset === 0) {
          setResults(data.results || []);
        } else {
          setResults((prev) => [...prev, ...(data.results || [])]);
        }
        setTotal(data.total || 0);
      } catch {
        if (newOffset === 0) setResults([]);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    setOffset(0);
    search(query, activeTab, 0);
    // Update URL without navigation
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('tab', activeTab);
    window.history.replaceState(null, '', `/search?${params.toString()}`);
  }, [query, activeTab, search]);

  function loadMore() {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    search(query, activeTab, newOffset);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ძიება</h1>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="მოძებნეთ პოსტები, კურსები, წევრები..."
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && total > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">({total})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-1">
        {query && !loading && results.length === 0 && (
          <p className="py-12 text-center text-gray-500">
            &ldquo;{query}&rdquo; — შედეგები ვერ მოიძებნა
          </p>
        )}

        {/* Post results */}
        {activeTab === 'posts' &&
          results.map((post: any) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
            >
              <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                <AvatarImage src={post.authorAvatar || undefined} />
                <AvatarFallback className="text-xs">
                  {post.authorName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {post.content?.slice(0, 200)}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                  <span>{post.authorName}</span>
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  {post.createdAt && (
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ka,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}

        {/* Course results */}
        {activeTab === 'courses' &&
          results.map((course: any) => (
            <Link
              key={course.id}
              href={`/classroom/${course.slug}`}
              className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt=""
                  className="h-14 w-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-20 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {course.title}
                  </p>
                  {course.isPaid && (
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded flex-shrink-0">
                      ფასიანი
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {course.description?.slice(0, 150)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {course.totalLessons} გაკვეთილი
                </p>
              </div>
            </Link>
          ))}

        {/* Member results */}
        {activeTab === 'members' &&
          results.map((member: any) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={member.avatarUrl || undefined} />
                <AvatarFallback>
                  {member.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {member.name || 'უსახელო'}
                  </p>
                  <LevelBadge level={member.level} />
                </div>
                <p className="text-xs text-gray-500">{member.points} ქულა</p>
              </div>
            </Link>
          ))}
      </div>

      {/* Load more */}
      {results.length < total && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {loading ? 'იტვირთება...' : 'მეტის ჩატვირთვა'}
          </Button>
        </div>
      )}
    </div>
  );
}
